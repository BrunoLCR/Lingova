import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'

test('CP06 Tarifas por hora y pagos calculados por horas', async t => {
  const { db, factory } = seedAll()
  db.rpcHandlers.establecer_tarifa = a => {
    db.tables.tarifas_docentes.filter(x => x.docente_id === a.p_docente && x.moneda === a.p_moneda && !x.vigente_hasta).forEach(x => { x.vigente_hasta = '2026-10-03' })
    db.tables.tarifas_docentes.push({ id: db.nextId++, docente_id: a.p_docente, tarifa_hora: a.p_tarifa, moneda: a.p_moneda, vigente_hasta: null })
    return { data: db.nextId - 1, error: null }
  }
  const app = await startApp({ factory }); t.after(app.close)
  const admin = USERS.admin.token

  await t.test('/me expone los permisos del rol (RBAC por datos)', async () => {
    const r = await app.call('GET', '/api/me', { token: USERS.prof.token })
    assert.ok(r.body.permisos.includes('zoom:programar')); assert.ok(!r.body.permisos.includes('pagos:gestionar'))
  })
  await t.test('solo ADMIN define tarifas (permiso tarifas:gestionar)', async () => {
    for (const u of ['prof', 'emp', 'est', 'mkt']) assert.equal((await app.call('POST', '/api/tarifas', { token: USERS[u].token, body: { docente_id: USERS.prof.id, tarifa_hora: 40 } })).status, 403, u)
    assert.equal((await app.call('POST', '/api/tarifas', { token: admin, body: { docente_id: USERS.prof.id, tarifa_hora: 40 } })).status, 201)
  })
  await t.test('validación de tarifa', async () => {
    for (const body of [{ docente_id: 'x', tarifa_hora: 40 }, { docente_id: USERS.prof.id, tarifa_hora: -1 }, { docente_id: USERS.prof.id, tarifa_hora: 9999 }, { docente_id: USERS.prof.id, tarifa_hora: 10.555 }, { docente_id: USERS.prof.id, tarifa_hora: 40, moneda: 'EUR' }])
      assert.equal((await app.call('POST', '/api/tarifas', { token: admin, body })).status, 400, JSON.stringify(body))
  })
  await t.test('nueva tarifa cierra la anterior (una sola vigente)', async () => {
    await app.call('POST', '/api/tarifas', { token: admin, body: { docente_id: USERS.prof.id, tarifa_hora: 45 } })
    assert.equal(db.tables.tarifas_docentes.filter(x => !x.vigente_hasta).length, 1)
    assert.equal(db.tables.tarifas_docentes.find(x => !x.vigente_hasta).tarifa_hora, 45)
  })
  await t.test('pago por horas: monto = horas × tarifa vigente (calculado en servidor)', async () => {
    const r = await app.call('POST', '/api/pagos', { token: admin, body: { docente_id: USERS.prof.id, concepto: 'Clases octubre', horas: 12.5, monto: 1, metodo_pago: 'YAPE' } })
    assert.equal(r.status, 201); assert.equal(r.body.tarifa_hora, 45); assert.equal(r.body.monto, 562.5); assert.equal(r.body.horas, 12.5)
  })
  await t.test('pago por horas sin tarifa vigente → 400; horas inválidas → 400', async () => {
    const sinTarifa = await app.call('POST', '/api/pagos', { token: admin, body: { docente_id: USERS.prof2.id, concepto: 'Clases octubre', horas: 5, metodo_pago: 'YAPE' } })
    assert.equal(sinTarifa.status, 400); assert.match(sinTarifa.body.error, /tarifa/i)
    for (const horas of [0, -2, 301, 'abc']) assert.equal((await app.call('POST', '/api/pagos', { token: admin, body: { docente_id: USERS.prof.id, concepto: 'Clases octubre', horas, metodo_pago: 'YAPE' } })).status, 400, String(horas))
  })
})
