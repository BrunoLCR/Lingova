import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'
import { crearReunionZoom, cancelarReunionZoom } from '../src/services/zoomService.js'

const futuro = (d = 2) => new Date(Date.now() + d * 86400000).toISOString()
const claseOk = (over = {}) => ({ curso_id: 1, titulo: 'Speaking practice: Daily routines', fecha_inicio: futuro(), duracion_minutos: 60, ...over })

test('CP02 Programación de clases Zoom', async t => {
  const { db, factory } = seedAll()
  const llamadas = { crear: 0, cancelar: [] }
  const zoomClient = {
    crear: async (d, cfg) => { llamadas.crear++; return crearReunionZoom(d, { ...cfg, mode: 'mock' }) },
    cancelar: async id => { llamadas.cancelar.push(id); return true }
  }
  const app = await startApp({ factory, zoomClient })
  t.after(app.close)

  await t.test('PROFESOR programa clase de su curso → 201 con enlaces', async () => {
    const r = await app.call('POST', '/api/clases-zoom', { token: USERS.prof.token, body: claseOk() })
    assert.equal(r.status, 201)
    assert.match(r.body.zoom_join_url, /^https:\/\/zoom\.us\/j\//)
    assert.ok(r.body.zoom_start_url)
    assert.equal(r.body.simulado, true)
    assert.equal(r.body.estado, 'PROGRAMADA')
    assert.equal(r.body.docente_id, USERS.prof.id)
    assert.equal(db.tables.clases_zoom[0].duracion_minutos, 60)
  })
  await t.test('el listado nunca expone zoom_start_url', async () => {
    const r = await app.call('GET', '/api/clases-zoom', { token: USERS.est.token })
    assert.equal(r.status, 200)
    assert.equal(r.body.puede_programar, false)
    // el controlador solo pide columnas públicas; la fake devuelve la fila completa, así que se
    // verifica además que la consulta emitida no incluye la columna (ver select de CLASE_COLS)
    const src = (await import('node:fs')).readFileSync(new URL('../src/controllers/zoomController.js', import.meta.url), 'utf8')
    const cols = src.match(/const CLASE_COLS = '([^']+)'/)[1]
    assert.ok(!cols.includes('zoom_start_url'))
  })
  await t.test('validaciones: fecha pasada, duración, título, curso', async () => {
    const malos = [
      claseOk({ fecha_inicio: new Date(Date.now() - 3600e3).toISOString() }), claseOk({ fecha_inicio: 'mañana' }), claseOk({ fecha_inicio: undefined }),
      claseOk({ duracion_minutos: 5 }), claseOk({ duracion_minutos: 1000 }), claseOk({ duracion_minutos: 45.5 }),
      claseOk({ titulo: 'ab' }), claseOk({ curso_id: 'x' }), claseOk({ curso_id: -3 })
    ]
    for (const body of malos) {
      const r = await app.call('POST', '/api/clases-zoom', { token: USERS.prof.token, body })
      assert.equal(r.status, 400, JSON.stringify(body))
    }
  })
  await t.test('PROFESOR no puede programar en curso ajeno → 403 (y no crea reunión)', async () => {
    const antes = llamadas.crear
    const r = await app.call('POST', '/api/clases-zoom', { token: USERS.prof.token, body: claseOk({ curso_id: 2 }) })
    assert.equal(r.status, 403)
    assert.equal(llamadas.crear, antes)
  })
  await t.test('curso inexistente → 404', async () => {
    assert.equal((await app.call('POST', '/api/clases-zoom', { token: USERS.prof.token, body: claseOk({ curso_id: 777 }) })).status, 404)
  })
  await t.test('ADMIN programa clase para el docente titular del curso', async () => {
    const r = await app.call('POST', '/api/clases-zoom', { token: USERS.admin.token, body: claseOk({ curso_id: 2 }) })
    assert.equal(r.status, 201)
    assert.equal(r.body.docente_id, USERS.prof2.id)
  })
  await t.test('compensación: si falla la BD se cancela la reunión creada en Zoom', async () => {
    db.failInsert = 'clases_zoom'
    const r = await app.call('POST', '/api/clases-zoom', { token: USERS.prof.token, body: claseOk() })
    db.failInsert = null
    assert.equal(r.status, 400)
    assert.equal(llamadas.cancelar.length, 1)
  })
  await t.test('estado: transiciones válidas e inválidas; solo el anfitrión', async () => {
    const id = db.tables.clases_zoom[0].id
    assert.equal((await app.call('PATCH', `/api/clases-zoom/${id}/estado`, { token: USERS.prof2.token, body: { estado: 'CANCELADA' } })).status, 403)
    assert.equal((await app.call('PATCH', `/api/clases-zoom/${id}/estado`, { token: USERS.prof.token, body: { estado: 'FINALIZADA' } })).status, 400)
    assert.equal((await app.call('PATCH', `/api/clases-zoom/${id}/estado`, { token: USERS.prof.token, body: { estado: 'XYZ' } })).status, 400)
    const ok = await app.call('PATCH', `/api/clases-zoom/${id}/estado`, { token: USERS.prof.token, body: { estado: 'CANCELADA' } })
    assert.equal(ok.status, 200); assert.equal(ok.body.estado, 'CANCELADA')
    assert.equal((await app.call('PATCH', `/api/clases-zoom/${id}/estado`, { token: USERS.prof.token, body: { estado: 'EN_CURSO' } })).status, 400)
  })
  await t.test('enlace de anfitrión: solo si la función SQL lo entrega', async () => {
    db.rpcHandlers.clase_zoom_start_url = () => ({ data: null, error: null })
    assert.equal((await app.call('GET', '/api/clases-zoom/1/anfitrion', { token: USERS.prof.token })).status, 403)
    db.rpcHandlers.clase_zoom_start_url = () => ({ data: 'https://zoom.us/s/1?zak=abc', error: null })
    assert.equal((await app.call('GET', '/api/clases-zoom/1/anfitrion', { token: USERS.prof.token })).status, 200)
    assert.equal((await app.call('GET', '/api/clases-zoom/1/anfitrion', { token: USERS.est.token })).status, 403)
  })
})

test('Servicio Zoom: modo live con OAuth Server-to-Server (fetch simulado)', async () => {
  const calls = []
  const fakeFetch = async (url, opts) => {
    calls.push({ url, opts })
    if (url.startsWith('https://zoom.us/oauth/token')) return { ok: true, json: async () => ({ access_token: 'tok', expires_in: 3600 }) }
    if (url.includes('/meetings') && opts.method === 'POST') return { ok: true, json: async () => ({ id: 987654321, join_url: 'https://zoom.us/j/987654321', start_url: 'https://zoom.us/s/987654321?zak=x' }) }
    if (opts.method === 'DELETE') return { ok: true, status: 204 }
    return { ok: false, status: 500 }
  }
  const cfg = { mode: 'live', accountId: 'acc', clientId: 'cid', clientSecret: 'sec', userId: 'me' }
  const m = await crearReunionZoom({ titulo: 'Clase', fechaInicioISO: '2026-10-10T15:00:00.000Z', duracionMinutos: 45 }, cfg, fakeFetch)
  assert.equal(m.simulado, false); assert.equal(m.meetingId, '987654321')
  const body = JSON.parse(calls.find(c => c.opts.method === 'POST' && c.url.includes('/meetings')).opts.body)
  assert.equal(body.start_time, '2026-10-10T15:00:00Z'); assert.equal(body.duration, 45); assert.equal(body.timezone, 'America/Lima')
  assert.match(calls[0].opts.headers.Authorization, /^Basic /)
  assert.equal(await cancelarReunionZoom('987654321', cfg, fakeFetch), true)
  const mock = await crearReunionZoom({ titulo: 'x', fechaInicioISO: new Date().toISOString(), duracionMinutos: 30 }, { mode: 'mock' })
  assert.equal(mock.simulado, true)
})
