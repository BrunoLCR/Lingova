// Sanitización de entradas: elimina caracteres de control y marcadores HTML.
// (React ya escapa al renderizar; esto es defensa en profundidad antes de persistir.)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML = /[<>]/g

export function cleanText(value, max = 255) {
  if (value === undefined || value === null) return ''
  return String(value).replace(CONTROL, '').replace(HTML, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = v => typeof v === 'string' && UUID.test(v)

export function toPositiveInt(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}
