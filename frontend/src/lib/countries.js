// Países permitidos en el registro (ISO 3166-1 alfa-2) + 'GLOBAL'. Los nombres salen de Intl.DisplayNames.
export const LATAM = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE']
export const NA_ES = ['US', 'ES']
export const GLOBAL = 'GLOBAL'
export const VALID_COUNTRIES = [...LATAM, ...NA_ES, GLOBAL]

export function countryName(code, lang) {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code } catch { return code }
}
export const sortedCountries = (codes, lang) => [...codes].sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang), lang))
