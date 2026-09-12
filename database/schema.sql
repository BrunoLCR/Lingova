-- LINGOVA - Esquema referencial para PostgreSQL / Supabase
-- Esta versión del proyecto es visual y no se conecta a la base de datos.

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol_id INTEGER REFERENCES roles(id),
  estado VARCHAR(20) DEFAULT 'ACTIVO',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  nivel VARCHAR(30),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'ACTIVO'
);

CREATE TABLE matriculas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  curso_id INTEGER REFERENCES cursos(id),
  fecha_matricula DATE DEFAULT CURRENT_DATE,
  progreso NUMERIC(5,2) DEFAULT 0
);

CREATE TABLE evaluaciones (
  id SERIAL PRIMARY KEY,
  curso_id INTEGER REFERENCES cursos(id),
  titulo VARCHAR(150) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos_auditoria (
  id_evento BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(80) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  descripcion TEXT,
  hash_integridad TEXT
);

INSERT INTO roles (nombre) VALUES ('ADMINISTRADOR'), ('PROFESOR');

-- Cuentas demostrativas referenciales (no usadas por el frontend estático)
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
('Administrador Lingova','admin@lingova.pe','DEMO_NO_USAR_EN_PRODUCCION',1),
('Profesor Lingova','profesor@lingova.pe','DEMO_NO_USAR_EN_PRODUCCION',2);
