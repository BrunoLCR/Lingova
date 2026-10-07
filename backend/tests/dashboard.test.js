import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'

test('CP10 Dashboard general /api/dashboard detecta el rol', async t => {
  const { factory } = seedAll()
  const app = await startApp({ factory }); t.after(app.close)

  await t.test('sin token → 401', async () => {
    assert.equal((await app.call('GET', '/api/dashboard')).status, 401)
  })
  await t.test('cada rol recibe SU dashboard (200) con su propio perfil', async () => {
    for (const [u, rol] of [['est', 'ESTUDIANTE'], ['prof', 'PROFESOR'], ['admin', 'ADMINISTRADOR'], ['mkt', 'MARKETING'], ['emp', 'EMPRESA']]) {
      const r = await app.call('GET', '/api/dashboard', { token: USERS[u].token })
      assert.equal(r.status, 200, `${u}: ${JSON.stringify(r.body)}`)
      assert.equal(r.body.profile.role, rol)
      assert.equal(r.body.profile.id, USERS[u].id)
    }
  })
  await t.test('cuenta inactiva → 403', async () => {
    assert.equal((await app.call('GET', '/api/dashboard', { token: USERS.off.token })).status, 403)
  })
  await t.test('404 con diagnóstico cuando la URL repite /api/api', async () => {
    const r = await app.call('GET', '/api/api/student/dashboard', { token: USERS.est.token })
    assert.equal(r.status, 404); assert.match(r.body.pista, /VITE_API_URL/); assert.equal(r.body.ruta, '/api/api/student/dashboard')
  })
})
