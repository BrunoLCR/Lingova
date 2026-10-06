import { readFileSync } from 'node:fs'

const RBAC = JSON.parse(readFileSync(new URL('../../../database/rbac_matrix.json', import.meta.url), 'utf8'))
const ROLES_PERMISOS = Object.entries(RBAC.roles_permisos).flatMap(([rol, ps]) => ps.map(permiso => ({ rol, permiso })))

// Cliente Supabase simulado en memoria para probar la lógica del backend sin red.
// (La seguridad a nivel de BD/RLS se prueba aparte en database/tests/run_sql_tests.py)
export function createFakeSupabase(seed = {}) {
  const db = {
    tables: {
      profiles: [], tarifas_docentes: [], roles_permisos: ROLES_PERMISOS, courses: [], pagos: [], clases_zoom: [], eventos_auditoria: [], empresas: [],
      enrollments: [], ...(seed.tables || {})
    },
    sessions: seed.sessions || {},            // token -> userId
    files: seed.files || {},                  // 'pagos/1' -> ['recibo.pdf']
    rpcCalls: [],
    rpcHandlers: seed.rpcHandlers || {},
    nextId: 100
  }

  class Query {
    constructor(table) { this.table = table; this.filters = []; this.op = null; this.single_ = false; this.maybe_ = false }
    select(_cols, opts) { if (!this.op) this.op = 'select'; this.opts = opts; return this }
    insert(p) { this.op = 'insert'; this.payload = p; return this }
    update(p) { this.op = 'update'; this.payload = p; return this }
    eq(c, v) { this.filters.push(r => r[c] === v); return this }
    in(c, vs) { this.filters.push(r => vs.includes(r[c])); return this }
    is(c, v) { this.filters.push(r => (r[c] ?? null) === v); return this }
    gte(c, v) { this.filters.push(r => String(r[c]) >= String(v)); return this }
    order() { return this }
    limit() { return this }
    single() { this.single_ = true; return this }
    maybeSingle() { this.maybe_ = true; return this }
    then(resolve, reject) { return Promise.resolve(this.exec()).then(resolve, reject) }
    exec() {
      const rows = db.tables[this.table] ?? (db.tables[this.table] = [])
      const match = rows.filter(r => this.filters.every(f => f(r)))
      let data
      if (this.op === 'insert') {
        if (db.failInsert === this.table) return { data: null, error: { code: '23514', message: 'check violation' } }
        const row = { id: db.nextId++, created_at: new Date().toISOString(), ...this.payload }
        rows.push(row); data = [row]
      } else if (this.op === 'update') {
        match.forEach(r => Object.assign(r, this.payload)); data = match
      } else data = match
      if (this.opts?.head) return { data: null, count: data.length, error: null }
      if (this.single_) return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } }
      if (this.maybe_) return { data: data[0] ?? null, error: null }
      return { data, error: null, count: data.length }
    }
  }

  const client = {
    auth: {
      getUser: async token => {
        const uid = db.sessions[token]
        return uid ? { data: { user: { id: uid } }, error: null } : { data: { user: null }, error: { message: 'invalid' } }
      }
    },
    from: t => new Query(t),
    rpc: async (name, args) => {
      db.rpcCalls.push({ name, args })
      const h = db.rpcHandlers[name]
      return h ? h(args, db) : { data: null, error: null }
    },
    storage: {
      from: () => ({
        list: async (path, { search } = {}) => ({ data: (db.files[path] || []).filter(n => !search || n === search).map(name => ({ name })), error: null }),
        createSignedUrl: async p => ({ data: { signedUrl: `https://storage.test/signed/${p}?token=abc` }, error: null })
      })
    }
  }
  return { db, factory: () => client }
}

export const USERS = {
  admin: { id: '11111111-1111-4111-8111-111111111111', role: 'ADMINISTRADOR', token: 't-admin' },
  prof: { id: '22222222-2222-4222-8222-222222222222', role: 'PROFESOR', token: 't-prof' },
  prof2: { id: '33333333-3333-4333-8333-333333333333', role: 'PROFESOR', token: 't-prof2' },
  est: { id: '44444444-4444-4444-8444-444444444444', role: 'ESTUDIANTE', token: 't-est' },
  mkt: { id: '55555555-5555-4555-8555-555555555555', role: 'MARKETING', token: 't-mkt' },
  emp: { id: '66666666-6666-4666-8666-666666666666', role: 'EMPRESA', token: 't-emp', empresa_id: 1 },
  off: { id: '77777777-7777-4777-8777-777777777777', role: 'ESTUDIANTE', token: 't-off', status: 'INACTIVO' }
}

export function seedAll(extra = {}) {
  const profiles = Object.entries(USERS).map(([k, u]) => ({ id: u.id, full_name: k.toUpperCase(), email: `${k}@lingova.pe`, role: u.role, status: u.status || 'ACTIVO', empresa_id: u.empresa_id ?? null }))
  const sessions = Object.fromEntries(Object.values(USERS).map(u => [u.token, u.id]))
  return createFakeSupabase({
    sessions,
    tables: {
      profiles,
      courses: [
        { id: 1, name: 'English A2', teacher_id: USERS.prof.id, status: 'ACTIVO' },
        { id: 2, name: 'TOEFL', teacher_id: USERS.prof2.id, status: 'ACTIVO' }
      ],
      cursos_docentes: [{ curso_id: 1, docente_id: USERS.prof.id }, { curso_id: 2, docente_id: USERS.prof2.id }],
      ...(extra.tables || {})
    },
    files: extra.files,
    rpcHandlers: extra.rpcHandlers
  })
}
