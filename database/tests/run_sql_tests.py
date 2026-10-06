"""
Pruebas del esquema SQL (RLS, triggers, hash SHA-256, inmutabilidad) sobre PostgreSQL local.
Uso:  pip install pgserver psycopg2-binary && python database/tests/run_sql_tests.py
"""
import pathlib, tempfile, sys, uuid, json
import pgserver, psycopg2, psycopg2.extras

ROOT = pathlib.Path(__file__).resolve().parents[1]
tmp = tempfile.mkdtemp()
srv = pgserver.get_server(tmp)
conn = psycopg2.connect(srv.get_uri()); conn.autocommit = True
cur = conn.cursor()
results = []

def ok(name, cond, extra=""):
    results.append((name, bool(cond), extra)); print(("PASS" if cond else "FAIL"), "-", name, extra)

def sql(q, params=None): cur.execute(q, params); return cur

def as_user(uid):
    sql("reset role"); sql("select set_config('request.jwt.claim.sub', %s, false)", (str(uid),)); sql("set role authenticated")
def as_admin_db():
    sql("reset role"); sql("select set_config('request.jwt.claim.sub', '', false)")

def expect_error(name, q, params=None, contains=None):
    sql("savepoint s") if False else None
    try:
        sql(q, params); ok(name, False, "(no lanzó error)")
    except Exception as e:
        msg = str(e).strip().splitlines()[0]
        ok(name, contains is None or contains.lower() in msg.lower(), f"-> {msg}")

# ---- Cargar stub + esquema (dos veces: idempotencia) ----
sql((ROOT/"tests/00_supabase_stub.sql").read_text())
schema = (ROOT/"schema.sql").read_text()
sql(schema); sql(schema)
ok("schema.sql se ejecuta y es idempotente (2 ejecuciones)", True)

# ---- Datos base ----
ids = {r: uuid.uuid4() for r in ["adm","prof","prof2","est","mkt","emp"]}
sql("insert into public.empresas (razon_social, ruc) values ('ACME SAC','20123456789'), ('Otra SAC','20987654321')")
for k, role in [("adm","ADMINISTRADOR"),("prof","PROFESOR"),("prof2","PROFESOR"),("est","ESTUDIANTE"),("mkt","MARKETING"),("emp","EMPRESA")]:
    sql("insert into auth.users (id,email) values (%s,%s)", (str(ids[k]), f"{k}@lingova.pe"))
    sql("insert into public.profiles (id, full_name, email, role, empresa_id) values (%s,%s,%s,%s,%s) on conflict (id) do update set full_name=excluded.full_name, role=excluded.role, empresa_id=excluded.empresa_id",
        (str(ids[k]), k.upper(), f"{k}@lingova.pe", role, 1 if role=="EMPRESA" else None))
ok("5 roles aceptados por el CHECK de profiles", sql("select count(distinct role) from public.profiles").fetchone()[0]==5)
expect_error("rol inválido rechazado", "insert into public.profiles (id, full_name,email,role) values (gen_random_uuid(),'x','x@x','HACKER')", contains="foreign key")
expect_error("usuario EMPRESA sin empresa rechazado", "insert into public.profiles (id, full_name,email,role) values (gen_random_uuid(),'x','y@x','EMPRESA')", contains="check")

# ---- RBAC (matriz rol-permiso) ----
rbac = json.load(open(ROOT/"rbac_matrix.json"))
exp = {(r,p) for r,l in rbac["roles_permisos"].items() for p in l}
got = set(sql("select rol, permiso from public.roles_permisos").fetchall())
ok("roles_permisos coincide EXACTAMENTE con rbac_matrix.json (usada por el backend)", exp==got, f"({len(got)} pares)")
ok("roles y permisos sembrados", sql("select count(*) from public.roles").fetchone()[0]==5 and sql("select count(*) from public.permisos").fetchone()[0]==len(rbac["permisos"]))
as_user(ids['adm']); ok("tiene_permiso: ADMIN tiene tarifas:gestionar", sql("select public.tiene_permiso('tarifas:gestionar')").fetchone()[0])
as_user(ids['prof']); ok("tiene_permiso: PROFESOR NO tiene pagos:gestionar", not sql("select public.tiene_permiso('pagos:gestionar')").fetchone()[0])
expect_error("authenticated no puede alterar roles_permisos", "insert into public.roles_permisos values ('PROFESOR','pagos:gestionar')", contains="permission denied")
as_admin_db()
sql("insert into public.courses (name, level, teacher_id) values ('English A2','A2',%s),('TOEFL','B2',%s)", (str(ids['prof']), str(ids['prof2'])))
sql("insert into public.enrollments (student_id, course_id) values (%s,1)", (str(ids['est']),))

# ---- PAGOS ----
as_user(ids['adm'])
sql("""insert into public.pagos (docente_id, concepto, monto, metodo_pago, registrado_por)
       values (%s,'Honorarios septiembre',1200.50,'TRANSFERENCIA',%s)""", (str(ids['prof']), str(ids['adm'])))
ok("ADMIN crea pago", sql("select count(*) from public.pagos").fetchone()[0]==1)
expect_error("monto <= 0 rechazado", "insert into public.pagos (docente_id,concepto,monto,metodo_pago) values (%s,'x pago',-5,'YAPE')", (str(ids['prof']),), "check")
expect_error("PAGADO sin fecha_pago rechazado", "insert into public.pagos (docente_id,concepto,monto,metodo_pago,estado) values (%s,'x pago',5,'YAPE','PAGADO')", (str(ids['prof']),), "check")
expect_error("pagador EMPRESA sin empresa_id rechazado", "insert into public.pagos (docente_id,concepto,monto,metodo_pago,pagador_tipo) values (%s,'x pago',5,'YAPE','EMPRESA')", (str(ids['prof']),), "check")
sql("delete from public.pagos")
ok("DELETE de pagos afecta 0 filas (sin policy de DELETE)", sql("select count(*) from public.pagos").fetchone()[0]==1)

as_user(ids['prof']);  ok("PROFESOR ve sus pagos", sql("select count(*) from public.pagos").fetchone()[0]>=1)
as_user(ids['prof2']); ok("OTRO profesor NO ve pagos ajenos", sql("select count(*) from public.pagos").fetchone()[0]==0)
as_user(ids['est']);   ok("ESTUDIANTE NO ve pagos", sql("select count(*) from public.pagos").fetchone()[0]==0)
as_user(ids['mkt']);   ok("MARKETING NO ve pagos", sql("select count(*) from public.pagos").fetchone()[0]==0)
expect_error("ESTUDIANTE no puede insertar pagos", "insert into public.pagos (docente_id,concepto,monto,metodo_pago) values (%s,'hack pago',1,'YAPE')", (str(ids['prof']),), "row-level security")
as_user(ids['emp'])
sql("insert into public.pagos (docente_id,concepto,monto,metodo_pago,pagador_tipo,empresa_id) values (%s,'Pago empresa',300,'PLIN','EMPRESA',1)", (str(ids['prof']),))
ok("EMPRESA crea pago de su empresa", True)
expect_error("EMPRESA no puede pagar a nombre de otra empresa", "insert into public.pagos (docente_id,concepto,monto,metodo_pago,pagador_tipo,empresa_id) values (%s,'Pago ajeno',300,'PLIN','EMPRESA',2)", (str(ids['prof']),), "row-level security")
ok("EMPRESA solo ve pagos de su empresa", sql("select count(*) from public.pagos").fetchone()[0]==1)
sql("update public.pagos set estado='PAGADO', fecha_pago=current_date")
ok("EMPRESA no puede actualizar pagos (0 filas afectadas)", sql("select count(*) from public.pagos where estado='PAGADO'").fetchone()[0]==0)
as_admin_db(); P_ADM = sql("select id from public.pagos where empresa_id is null").fetchone()[0]; P_EMP = sql("select id from public.pagos where empresa_id=1").fetchone()[0]; as_user(ids['emp'])
sql("select public.adjuntar_comprobante(%s,%s,'recibo.pdf')", (P_EMP, f"pagos/{P_EMP}/recibo.pdf"))
ok("EMPRESA adjunta comprobante a SU pago (función)", True)
expect_error("EMPRESA no adjunta a pago ajeno", f"select public.adjuntar_comprobante({P_ADM},'pagos/{P_ADM}/x.pdf','x.pdf')", contains="permisos")

# ---- STORAGE policies ----
as_admin_db()
sql("insert into storage.objects (bucket_id,name) values ('comprobantes-pagos',%s),('comprobantes-pagos',%s)", (f"pagos/{P_ADM}/recibo.pdf", f"pagos/{P_EMP}/recibo.pdf"))
as_user(ids['prof']);  ok("Docente ve comprobantes de sus pagos (ambos pagos son suyos)", sql("select count(*) from storage.objects").fetchone()[0]==2)
as_user(ids['prof2']); ok("Otro docente no ve comprobantes ajenos", sql("select count(*) from storage.objects").fetchone()[0]==0)
as_user(ids['emp']);   ok("Empresa solo ve comprobante de su pago", sql("select count(*) from storage.objects").fetchone()[0]==1)
as_user(ids['est']);   ok("Estudiante no ve comprobantes", sql("select count(*) from storage.objects").fetchone()[0]==0)

# ---- REGISTRO PÚBLICO (trigger handle_new_user) ----
as_admin_db()
sql("insert into auth.users (id,email,raw_user_meta_data) values (gen_random_uuid(),'nuevo@x.pe','{\"full_name\":\"Ana María Pérez\",\"country\":\"mx\"}')")
r = sql("select full_name, role, status, country from public.profiles where email='nuevo@x.pe'").fetchone()
ok("signUp crea el perfil con full_name, country (normalizado) y rol ESTUDIANTE", r==("Ana María Pérez","ESTUDIANTE","ACTIVO","MX"), f"-> {r}")
sql("insert into auth.users (id,email,raw_user_meta_data) values (gen_random_uuid(),'hack@x.pe','{\"full_name\":\"<b>Eve</b> X\",\"country\":\"ZZZ\",\"role\":\"ADMINISTRADOR\"}')")
r = sql("select full_name, role, country from public.profiles where email='hack@x.pe'").fetchone()
ok("metadatos del cliente no pueden elevar el rol; HTML y país inválido se neutralizan", r[1]=="ESTUDIANTE" and "<" not in r[0] and r[2] is None, f"-> {r}")
sql("insert into auth.users (id,email) values (gen_random_uuid(),'sinnombre@x.pe')")
ok("sin nombre usa el prefijo del correo; GLOBAL es válido", sql("select full_name from public.profiles where email='sinnombre@x.pe'").fetchone()[0]=="sinnombre")
sql("insert into auth.users (id,email,raw_user_meta_data) values (gen_random_uuid(),'glob@x.pe','{\"country\":\"global\"}')")
ok("país GLOBAL aceptado", sql("select country from public.profiles where email='glob@x.pe'").fetchone()[0]=="GLOBAL")
expect_error("CHECK de country rechaza valores libres", "update public.profiles set country='Peru' where email='glob@x.pe'", contains="check")

# ---- MATRÍCULA AUTOGESTIONADA ----
as_admin_db()
sql("insert into public.cursos_docentes (curso_id, docente_id) select id, teacher_id from public.courses")
as_user(ids['est'])
cat = sql("select curso_id, docente_id, ya_matriculado from public.catalogo_cursos() order by curso_id").fetchall()
ok("catálogo lista curso+docente y marca el curso ya matriculado", len(cat)==2 and cat[0][2] is True and cat[1][2] is False)
as_user(ids['prof']); expect_error("PROFESOR no puede ver el catálogo de matrícula", "select * from public.catalogo_cursos()", contains="permiso")
expect_error("PROFESOR no puede matricular", "select * from public.matricular_estudiante(2, %s, 'YAPE')", (str(ids['prof2']),), "permiso")
as_user(ids['est'])
expect_error("insert directo en enrollments denegado al estudiante", "insert into public.enrollments (student_id, course_id) values (%s, 2)", (str(ids['est']),), "row-level security")
expect_error("método de pago no permitido", "select * from public.matricular_estudiante(2, %s, 'BITCOIN')", (str(ids['prof2']),), "método")
expect_error("docente que no dicta el curso rechazado", "select * from public.matricular_estudiante(2, %s, 'YAPE')", (str(ids['prof']),), "no dicta")
expect_error("curso inexistente rechazado", "select * from public.matricular_estudiante(999, %s, 'YAPE')", (str(ids['prof']),), "no disponible")
r = sql("select referencia, monto, curso from public.matricular_estudiante(2, %s, 'yape')", (str(ids['prof2']),)).fetchone()
ok("matrícula con pago simulado devuelve referencia SIM-, monto del curso y nombre", r[0].startswith("SIM-") and float(r[1])==119.50 and r[2]=="TOEFL", f"-> {r}")
expect_error("matrícula duplicada rechazada", "select * from public.matricular_estudiante(2, %s, 'YAPE')", (str(ids['prof2']),), "ya estás matriculado")
row = sql("select docente_id, status, monto_pagado, metodo_pago_simulado from public.enrollments where student_id=%s and course_id=2", (str(ids['est']),)).fetchone()
ok("enrollments guarda docente elegido, estado ACTIVA, monto y método", str(row[0])==str(ids['prof2']) and row[1]=="ACTIVA" and float(row[2])==119.5 and row[3]=="YAPE")
ok("vista matriculas muestra las matrículas del estudiante (RLS)", sql("select count(*) from public.matriculas").fetchone()[0]==2)
ok("nombres_docentes_matricula devuelve los docentes de mis cursos", len(sql("select * from public.nombres_docentes_matricula()").fetchall())==2)
as_user(ids['prof2']); ok("docente elegido (prof2) ve la matrícula del curso 2", sql("select count(*) from public.enrollments where course_id=2").fetchone()[0]==1)
as_user(ids['prof']);  ok("otro docente no ve la matrícula del curso 2 pero sí la del curso 1 (sin docente elegido)", sql("select count(*) from public.enrollments where course_id=2").fetchone()[0]==0 and sql("select count(*) from public.enrollments where course_id=1").fetchone()[0]==1)
as_user(ids['mkt']);   ok("MARKETING no ve matrículas", sql("select count(*) from public.matriculas").fetchone()[0]==0)
as_admin_db()
ok("la matrícula quedó auditada (MATRICULA_AUTOGESTIONADA)", sql("select count(*) from public.eventos_auditoria where tipo_evento='MATRICULA_AUTOGESTIONADA'").fetchone()[0]==1)
sql("update public.enrollments set status='RETIRADA' where student_id=%s and course_id=2", (str(ids['est']),))
as_user(ids['est']); sql("select * from public.matricular_estudiante(2, %s, 'PLIN')", (str(ids['prof2']),))
ok("una matrícula RETIRADA puede reactivarse con progreso 0", float(sql("select progress from public.enrollments where student_id=%s and course_id=2", (str(ids['est']),)).fetchone()[0])==0)

# ---- TARIFAS POR HORA ----
as_user(ids['prof']); expect_error("PROFESOR no puede definir tarifas", "select public.establecer_tarifa(%s, 50)", (str(ids['prof']),), "permiso")
expect_error("PROFESOR no inserta tarifas directo", "insert into public.tarifas_docentes (docente_id, tarifa_hora) values (%s, 99)", (str(ids['prof']),), "permission denied")
as_user(ids['adm'])
sql("select public.establecer_tarifa(%s, 40.00, 'PEN', '2026-09-01')", (str(ids['prof']),))
sql("select public.establecer_tarifa(%s, 45.00, 'PEN', '2026-10-01')", (str(ids['prof']),))
vig = sql("select count(*), max(tarifa_hora) from public.tarifas_docentes where docente_id=%s and vigente_hasta is null", (str(ids['prof']),)).fetchone()
ok("nueva tarifa cierra la anterior (una sola vigente: 45.00)", vig[0]==1 and float(vig[1])==45.0)
ok("tarifa anterior queda con vigente_hasta = día previo", str(sql("select vigente_hasta from public.tarifas_docentes where tarifa_hora=40").fetchone()[0])=="2026-09-30")
expect_error("ADMIN no puede definir tarifa a un no-docente", "select public.establecer_tarifa(%s, 40)", (str(ids['est']),), "docente")
expect_error("tarifa negativa rechazada", "select public.establecer_tarifa(%s, -4)", (str(ids['prof']),), "check")
as_user(ids['prof']); ok("PROFESOR ve su tarifa", sql("select count(*) from public.tarifas_docentes").fetchone()[0]==2)
as_user(ids['prof2']); ok("Otro profesor no ve tarifas ajenas", sql("select count(*) from public.tarifas_docentes").fetchone()[0]==0)
as_user(ids['adm'])
sql("insert into public.pagos (docente_id,concepto,horas,tarifa_hora,monto,metodo_pago) values (%s,'Clases oct',10,45,450,'YAPE')", (str(ids['prof']),))
expect_error("monto inconsistente con horas×tarifa rechazado", "insert into public.pagos (docente_id,concepto,horas,tarifa_hora,monto,metodo_pago) values (%s,'Clases oct',10,45,999,'YAPE')", (str(ids['prof']),), "check")
as_admin_db(); sql("delete from public.pagos where concepto='Clases oct'") if False else None

# ---- CLASES ZOOM ----
as_user(ids['prof'])
sql("""insert into public.clases_zoom (curso_id, docente_id, titulo, zoom_meeting_id, zoom_join_url, zoom_start_url, fecha_inicio, duracion_minutos)
       values (1,%s,'Speaking practice','123','https://zoom.us/j/123','https://zoom.us/s/123?zak=SECRETO', now()+interval '1 day', 60)""", (str(ids['prof']),))
ok("PROFESOR programa clase de su curso", True)
expect_error("PROFESOR no programa clase en curso ajeno", "insert into public.clases_zoom (curso_id,docente_id,titulo,fecha_inicio) values (2,%s,'Clase ajena', now()+interval '1 day')", (str(ids['prof']),), "row-level security")
expect_error("duración fuera de rango rechazada", "insert into public.clases_zoom (curso_id,docente_id,titulo,fecha_inicio,duracion_minutos) values (1,%s,'Clase larga', now()+interval '1 day', 900)", (str(ids['prof']),), "check")
ok("anfitrión obtiene start_url por función", sql("select public.clase_zoom_start_url(1)").fetchone()[0].endswith("SECRETO"))
as_user(ids['est'])
ok("ESTUDIANTE matriculado ve la clase (join_url)", sql("select zoom_join_url from public.clases_zoom").fetchone()[0]=='https://zoom.us/j/123')
expect_error("ESTUDIANTE NO puede leer zoom_start_url (permiso de columna)", "select zoom_start_url from public.clases_zoom", contains="permission denied")
ok("ESTUDIANTE no obtiene start_url por función", sql("select public.clase_zoom_start_url(1)").fetchone()[0] is None)
as_user(ids['prof2']); ok("Profesor ajeno no ve la clase", sql("select count(*) from public.clases_zoom").fetchone()[0]==0)
as_user(ids['est']); sql("update public.clases_zoom set estado='CANCELADA'")
as_admin_db(); ok("ESTUDIANTE no puede modificar clases", sql("select estado from public.clases_zoom where id=1").fetchone()[0]=='PROGRAMADA')

# ---- AUDITORÍA ----
as_admin_db()
n = sql("select count(*) from public.eventos_auditoria").fetchone()[0]
ok("Triggers de pagos/clases generaron eventos automáticamente", n >= 4, f"(eventos={n})")
rows = sql("select id, hash_anterior, hash_integridad from public.eventos_auditoria order by id").fetchall()
ok("Primer evento enlaza con GENESIS", rows[0][1]=="GENESIS")
ok("Cada evento enlaza con el hash del anterior", all(rows[i][1]==rows[i-1][2] for i in range(1,len(rows))))
ok("Hash SHA-256 tiene 64 hex", all(len(r[2])==64 for r in rows))
as_user(ids['est'])
sql("select public.registrar_evento('PRUEBA','ruta','/x','evento de prueba','{\"k\":1}'::jsonb)")
as_admin_db()
last = sql("select usuario_id, rol_usuario from public.eventos_auditoria order by id desc limit 1").fetchone()
ok("registrar_evento fija usuario y rol desde el token (no falsificable)", str(last[0])==str(ids['est']) and last[1]=="ESTUDIANTE")
as_user(ids['est'])
expect_error("authenticated no puede INSERT directo", "insert into public.eventos_auditoria (tipo_evento,hash_anterior,hash_integridad) values ('X','a','b')", contains="permission denied")
as_user(ids['adm'])
expect_error("ADMIN no puede UPDATE (sin privilegio)", "update public.eventos_auditoria set descripcion='x'", contains="permission denied")
expect_error("ADMIN no puede DELETE (sin privilegio)", "delete from public.eventos_auditoria", contains="permission denied")
as_admin_db()
expect_error("Ni el propietario puede UPDATE (trigger append-only)", "update public.eventos_auditoria set descripcion='manipulado' where id=1", contains="solo inserci")
expect_error("Ni el propietario puede DELETE (trigger append-only)", "delete from public.eventos_auditoria where id=1", contains="solo inserci")
expect_error("TRUNCATE bloqueado", "truncate public.eventos_auditoria", contains="solo inserci")
as_user(ids['adm'])
ok("verificar_cadena_auditoria: cadena íntegra", sql("select count(*) from public.verificar_cadena_auditoria()").fetchone()[0]==0)
as_user(ids['est']); expect_error("Solo ADMIN verifica la cadena", "select * from public.verificar_cadena_auditoria()", contains="administrador")
as_user(ids['est']); ok("ESTUDIANTE no lee eventos_auditoria", sql("select count(*) from public.eventos_auditoria").fetchone()[0]==0)

# Simular manipulación con acceso privilegiado (deshabilitando triggers) y detectar
as_admin_db()
sql("alter table public.eventos_auditoria disable trigger eventos_auditoria_no_update")
sql("update public.eventos_auditoria set descripcion='ALTERADO POR ATACANTE' where id=2")
sql("alter table public.eventos_auditoria enable trigger eventos_auditoria_no_update")
as_user(ids['adm'])
bad = sql("select evento_id, motivo from public.verificar_cadena_auditoria()").fetchall()
ok("La verificación DETECTA un evento alterado por fuera de la app", len(bad)==1 and bad[0][0]==2, f"-> {bad}")

# ---- RBAC profiles / marketing / escalada ----
as_user(ids['est'])
sql("update public.profiles set role='ADMINISTRADOR' where id=%s", (str(ids['est']),)) if False else None
try:
    sql("update public.profiles set role='ADMINISTRADOR' where id=%s", (str(ids['est']),)); esc=True
except Exception: esc=False
as_admin_db()
ok("ESTUDIANTE no puede auto-escalar su rol", sql("select role from public.profiles where id=%s",(str(ids['est']),)).fetchone()[0]=="ESTUDIANTE")
sql("insert into public.publicaciones_instagram (titulo, estado) values ('Promo','BORRADOR')")
as_user(ids['mkt']); ok("MARKETING ve publicaciones", sql("select count(*) from public.publicaciones_instagram").fetchone()[0]==1)
as_user(ids['est']); ok("ESTUDIANTE no ve publicaciones", sql("select count(*) from public.publicaciones_instagram").fetchone()[0]==0)

passed = sum(1 for _,p,_ in results if p); total = len(results)
print(f"\nRESUMEN: {passed}/{total} pruebas SQL aprobadas")
json.dump([{"prueba":n,"aprobada":p,"detalle":e} for n,p,e in results], open(ROOT/"tests/resultados_sql.json","w"), ensure_ascii=False, indent=2)
sys.exit(0 if passed==total else 1)
