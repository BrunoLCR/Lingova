// Catálogo público de la Landing (6 cursos base). `dbName` coincide con courses.name en Supabase
// (ver database/seed-cursos-catalogo.sql) para continuar la matrícula en AgregarCursoModal.
export const CATEGORIAS = ['general', 'business', 'exams', 'tech']

export const CURSOS_CATALOGO = [
  { id: 'basico', dbName: 'Inglés Básico', level: 'A1-A2', cat: 'general', price: null,
    es: { title: 'Inglés Básico', desc: 'Construye tu base: vocabulario esencial, gramática inicial y primeras conversaciones.', levelNote: 'Principiante: te presentas, hablas de tu rutina y entiendes frases cotidianas.' },
    en: { title: 'Basic English', desc: 'Build your foundation: essential vocabulary, basic grammar and first conversations.', levelNote: 'Beginner: introduce yourself, talk about your routine and understand everyday phrases.' } },
  { id: 'intermedio', dbName: 'Inglés Intermedio', level: 'B1-B2', cat: 'general', price: null,
    es: { title: 'Inglés Intermedio', desc: 'Gana fluidez para viajar, trabajar y conversar con seguridad.', levelNote: 'Intermedio: te comunicas con fluidez en el trabajo y en viajes, y entiendes las ideas principales de textos complejos.' },
    en: { title: 'Intermediate English', desc: 'Gain fluency to travel, work and hold conversations with confidence.', levelNote: 'Intermediate: communicate fluently at work and while traveling, and understand the main ideas of complex texts.' } },
  { id: 'avanzado', dbName: 'Inglés Avanzado', level: 'C1', cat: 'general', price: null,
    es: { title: 'Inglés Avanzado', desc: 'Perfecciona tu precisión, vocabulario y comprensión en contextos exigentes.', levelNote: 'Avanzado: te expresas con precisión y naturalidad en contextos académicos y profesionales.' },
    en: { title: 'Advanced English', desc: 'Refine your accuracy, vocabulary and comprehension in demanding contexts.', levelNote: 'Advanced: express yourself accurately and naturally in academic and professional settings.' } },
  { id: 'business', dbName: 'Business English Pro', level: 'B2', cat: 'business', price: 119.5,
    es: { title: 'Business English Pro', desc: 'Reuniones, presentaciones, correos y negociaciones en inglés. Certificación reconocida.', levelNote: 'Intermedio-alto: desempeño profesional en reuniones, presentaciones y negociaciones.' },
    en: { title: 'Business English Pro', desc: 'Meetings, presentations, emails and negotiations in English. Recognized certification.', levelNote: 'Upper-intermediate: professional performance in meetings, presentations and negotiations.' } },
  { id: 'exams', dbName: 'Preparación TOEFL / IELTS Ready', level: 'B2-C1', cat: 'exams', price: null,
    es: { title: 'Preparación TOEFL / IELTS Ready', desc: 'Estrategias, simulacros y práctica de las cuatro habilidades para tu examen.', levelNote: 'Intermedio-alto a avanzado: requisito habitual para estudiar o trabajar en el extranjero.' },
    en: { title: 'TOEFL / IELTS Ready Prep', desc: 'Strategies, mock tests and practice of all four skills for your exam.', levelNote: 'Upper-intermediate to advanced: a common requirement to study or work abroad.' } },
  { id: 'tech', dbName: 'English for Tech', level: 'B1-B2', cat: 'tech', price: null,
    es: { title: 'English for Tech', desc: 'Inglés para equipos de tecnología: dailies, documentación, code reviews y entrevistas.', levelNote: 'Intermedio: comunicación técnica en equipos de software, datos y producto.' },
    en: { title: 'English for Tech', desc: 'English for tech teams: dailies, documentation, code reviews and interviews.', levelNote: 'Intermediate: technical communication in software, data and product teams.' } }
]

export const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// Filtro en tiempo real por título (ES/EN), nivel y categoría (ES/EN) + chip de categoría
export function filtrarCursos(cursos, query, cat, labelsByLang) {
  const q = norm(query)
  return cursos.filter(c => {
    if (cat !== 'all' && c.cat !== cat) return false
    if (!q) return true
    const hay = norm([c.es.title, c.en.title, c.level, c.level.replace('-', ' '), labelsByLang.es[c.cat], labelsByLang.en[c.cat]].join(' | '))
    return q.split(/\s+/).every(w => hay.includes(w))
  })
}
