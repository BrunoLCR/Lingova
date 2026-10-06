// Registro de eventos de aplicación (accesos, consultas sensibles, denegaciones).
// Los cambios de datos en pagos / clases_zoom los audita la propia BD con triggers.
// El hash SHA-256 y el encadenamiento los calcula PostgreSQL (trigger BEFORE INSERT).
export async function registrarEvento(supabase, { tipo, entidad = null, entidadId = null, descripcion = null, datos = {} }) {
  try {
    const { error } = await supabase.rpc('registrar_evento', {
      p_tipo: tipo,
      p_entidad: entidad,
      p_entidad_id: entidadId === null ? null : String(entidadId),
      p_descripcion: descripcion,
      p_datos: datos
    })
    if (error) console.error('[auditoria] no se pudo registrar el evento:', tipo, error.message)
    return !error
  } catch (e) {
    console.error('[auditoria] error inesperado:', e.message)
    return false
  }
}
