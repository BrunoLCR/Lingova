import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'

test('CP01 Autenticación y control de acceso por roles (RBAC)', async t => {
  const { db, factory } = seedAll()
  const app = await startApp({ factory })
  t.after(app.close)

  await t.test('health es público', async () => {
    const r = await app.call('GET', '/api/health')
    assert.equal(r.status, 200)
    assert.equal(r.body.ok, true)
  })
  await t.test('sin token → 401', async () => {
    assert.equal((await app.call('GET', '/api/me')).status, 401)
    assert.equal((await app.call('GET', '/api/pagos')).status, 401)
  })
  await t.test('token inválido → 401', async () => {
    assert.equal((await app.call('GET', '/api/me', { token: 'basura' })).status, 401)
  })
  await t.test('token válido → devuelve perfil con rol', async () => {
    const r = await app.call('GET', '/api/me', { token: USERS.prof.token })
    assert.equal(r.status, 200)
    assert.equal(r.body.role, 'PROFESOR')
  })
  await t.test('usuario INACTIVO → 403', async () => {
    assert.equal((await app.call('GET', '/api/me', { token: USERS.off.token })).status, 403)
  })
  await t.test('matriz RBAC: rol incorrecto → 403', async () => {
    const casos = [
      ['est', 'GET', '/api/admin/dashboard'],
      ['prof', 'GET', '/api/admin/auditoria'],
      ['emp', 'GET', '/api/admin/auditoria/verificar'],
      ['mkt', 'GET', '/api/pagos'],
      ['est', 'GET', '/api/pagos'],
      ['est', 'POST', '/api/pagos'],
      ['prof', 'POST', '/api/pagos'],
      ['est', 'POST', '/api/clases-zoom'],
      ['emp', 'POST', '/api/clases-zoom'],
      ['mkt', 'GET', '/api/professor/dashboard'],
      ['prof', 'GET', '/api/empresa/dashboard'],
      ['prof', 'PATCH', '/api/pagos/1/estado'],
      ['emp', 'PATCH', '/api/pagos/1/estado']
    ]
    for (const [u, m, p] of casos) {
      const r = await app.call(m, p, { token: USERS[u].token, body: m === 'GET' ? undefined : {} })
      assert.equal(r.status, 403, `${u} ${m} ${p} debería ser 403 y fue ${r.status}`)
    }
  })
  await t.test('matriz RBAC: rol correcto no recibe 403', async () => {
    const casos = [['admin', '/api/admin/dashboard'], ['prof', '/api/professor/dashboard'], ['est', '/api/student/dashboard'], ['mkt', '/api/marketing/dashboard'], ['emp', '/api/empresa/dashboard']]
    for (const [u, p] of casos) {
      const r = await app.call('GET', p, { token: USERS[u].token })
      assert.notEqual(r.status, 403, `${u} ${p}`)
      assert.notEqual(r.status, 401, `${u} ${p}`)
    }
  })
  await t.test('las denegaciones quedan auditadas (ACCESO_DENEGADO)', async () => {
    const n = db.rpcCalls.filter(c => c.name === 'registrar_evento' && c.args.p_tipo === 'ACCESO_DENEGADO').length
    assert.ok(n >= 10, `eventos de denegación: ${n}`)
  })
  await t.test('ruta inexistente → 404 y JSON inválido → 400', async () => {
    assert.equal((await app.call('GET', '/api/nada', { token: USERS.admin.token })).status, 404)
    const r = await app.call('POST', '/api/pagos', { token: USERS.admin.token, body: '{no-json' })
    assert.equal(r.status, 400)
  })
  await t.test('cabeceras de seguridad (helmet) y sin x-powered-by', async () => {
    const r = await app.call('GET', '/api/health')
    assert.ok(r.headers.get('x-content-type-options'))
    assert.equal(r.headers.get('x-powered-by'), null)
  })
  await t.test('CORS rechaza orígenes no configurados', async () => {
    const r = await app.call('GET', '/api/health', { headers: { Origin: 'https://evil.example' } })
    assert.equal(r.status, 403)
    const ok = await app.call('GET', '/api/health', { headers: { Origin: 'http://localhost:4200' } })
    assert.equal(ok.status, 200)
  })
})
