import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'

const pagoOk = (over = {}) => ({ docente_id: USERS.prof.id, concepto: 'Honorarios septiembre 2026', monto: 1200.5, moneda: 'PEN', metodo_pago: 'TRANSFERENCIA', ...over })

test('CP03 Módulo de pagos a docentes', async t => {
  const { db, factory } = seedAll({ files: { 'pagos/100': ['recibo.pdf'] } })
  const app = await startApp({ factory })
  t.after(app.close)
  const admin = USERS.admin.token

  await t.test('ADMIN registra pago válido → 201', async () => {
    const r = await app.call('POST', '/api/pagos', { token: admin, body: pagoOk() })
    assert.equal(r.status, 201)
    assert.equal(r.body.estado, 'PENDIENTE')
    assert.equal(r.body.monto, 1200.5)
    assert.equal(db.tables.pagos[0].registrado_por, USERS.admin.id)
  })
  await t.test('validaciones de entrada → 400 con detalles', async () => {
    const malos = [
      pagoOk({ monto: -10 }), pagoOk({ monto: 0 }), pagoOk({ monto: 'abc' }), pagoOk({ monto: 12.345 }), pagoOk({ monto: 1e9 }),
      pagoOk({ moneda: 'EUR' }), pagoOk({ metodo_pago: 'BITCOIN' }), pagoOk({ docente_id: 'no-uuid' }),
      pagoOk({ concepto: 'x' }), pagoOk({ estado: 'PAGADO' }), pagoOk({ estado: 'ANULADO' }),
      pagoOk({ periodo_inicio: '2026-10-10', periodo_fin: '2026-09-01' }), pagoOk({ fecha_pago: '10/10/2026' })
    ]
    for (const body of malos) {
      const r = await app.call('POST', '/api/pagos', { token: admin, body })
      assert.equal(r.status, 400, JSON.stringify(body))
      assert.ok(Array.isArray(r.body.detalles))
    }
  })
  await t.test('sanitiza HTML y caracteres de control del concepto', async () => {
    const r = await app.call('POST', '/api/pagos', { token: admin, body: pagoOk({ concepto: '<script>alert(1)</script>Clases\u0000 octubre' }) })
    assert.equal(r.status, 201)
    assert.ok(!r.body.concepto.includes('<') && !r.body.concepto.includes('>') && !r.body.concepto.includes('\u0000'))
  })
  await t.test('beneficiario debe ser docente existente', async () => {
    const r1 = await app.call('POST', '/api/pagos', { token: admin, body: pagoOk({ docente_id: USERS.est.id }) })
    assert.equal(r1.status, 400)
    const r2 = await app.call('POST', '/api/pagos', { token: admin, body: pagoOk({ docente_id: '99999999-9999-4999-8999-999999999999' }) })
    assert.equal(r2.status, 400)
  })
  await t.test('EMPRESA: fuerza su empresa, estado PENDIENTE y no puede suplantar', async () => {
    const r = await app.call('POST', '/api/pagos', { token: USERS.emp.token, body: pagoOk({ pagador_tipo: 'ADMINISTRACION', empresa_id: 999, estado: 'PAGADO', fecha_pago: '2026-10-01' }) })
    assert.equal(r.status, 201)
    assert.equal(r.body.pagador_tipo, 'EMPRESA')
    assert.equal(r.body.empresa_id, 1)
    assert.equal(r.body.estado, 'PENDIENTE')
    assert.equal(r.body.fecha_pago, null)
  })
  await t.test('máquina de estados: PAGADO exige comprobante; ANULADO exige motivo', async () => {
    const id = db.tables.pagos[0].id
    let r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'PAGADO', fecha_pago: '2026-10-02' } })
    assert.equal(r.status, 400); assert.match(r.body.error, /comprobante/i)
    r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'ANULADO' } })
    assert.equal(r.status, 400); assert.match(r.body.error, /motivo/i)
    r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'FINALIZADO' } })
    assert.equal(r.status, 400)
  })
  await t.test('comprobante: rechaza path traversal, extensión y archivo inexistente', async () => {
    const id = db.tables.pagos[0].id
    for (const path of ['../../etc/passwd', `pagos/${id}/../x.pdf`, `pagos/999/a.pdf`, `pagos/${id}/virus.exe`, `pagos/${id}/a b.pdf`]) {
      const r = await app.call('POST', `/api/pagos/${id}/comprobante`, { token: admin, body: { path } })
      assert.equal(r.status, 400, path)
    }
    const r = await app.call('POST', `/api/pagos/${id}/comprobante`, { token: admin, body: { path: `pagos/${id}/noexiste.pdf` } })
    assert.equal(r.status, 400); assert.match(r.body.error, /no existe/i)
  })
  await t.test('flujo completo: adjuntar comprobante → PAGADO → URL firmada → anular', async () => {
    const id = db.tables.pagos[0].id // 100
    db.rpcHandlers.adjuntar_comprobante = (a) => { Object.assign(db.tables.pagos.find(p => p.id === a.p_pago_id), { comprobante_path: a.p_path, comprobante_nombre: a.p_nombre }); return { data: null, error: null } }
    let r = await app.call('POST', `/api/pagos/${id}/comprobante`, { token: admin, body: { path: `pagos/${id}/recibo.pdf`, nombre: 'recibo.pdf' } })
    assert.equal(r.status, 200)
    r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'PAGADO', fecha_pago: '2026-10-02' } })
    assert.equal(r.status, 200); assert.equal(r.body.estado, 'PAGADO')
    r = await app.call('GET', `/api/pagos/${id}/comprobante`, { token: USERS.prof.token })
    assert.equal(r.status, 200); assert.match(r.body.url, /signed/); assert.equal(r.body.expira_en_segundos, 120)
    assert.ok(db.rpcCalls.some(c => c.args?.p_tipo === 'COMPROBANTE_CONSULTADO'))
    r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'ANULADO', motivo: 'Monto mal digitado' } })
    assert.equal(r.status, 200)
    r = await app.call('PATCH', `/api/pagos/${id}/estado`, { token: admin, body: { estado: 'PAGADO', fecha_pago: '2026-10-03' } })
    assert.equal(r.status, 400, 'ANULADO es estado terminal')
  })
  await t.test('listado con resumen y filtro de estado validado', async () => {
    const r = await app.call('GET', '/api/pagos', { token: admin })
    assert.equal(r.status, 200); assert.ok(r.body.resumen.total_registros >= 3)
    assert.equal((await app.call('GET', '/api/pagos?estado=HACK', { token: admin })).status, 400)
  })
})
