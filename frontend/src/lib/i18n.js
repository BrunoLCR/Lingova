// i18n simple: estado `lang` ('es' | 'en') + diccionario plano.
export const LANGS = {
  es: { flag: '🇪🇸', code: 'ES', name: 'Español' },
  en: { flag: '🇬🇧', code: 'EN', name: 'English' }
}

const D = {
  es: {
    'nav.courses': 'Cursos', 'nav.search': 'Buscar cursos de inglés...', 'nav.login': 'Iniciar sesión', 'nav.start': 'Comenzar gratis',
    'nav.dashboard': 'Mi panel', 'nav.logout': 'Salir', 'nav.lang': 'Idioma', 'nav.brandSub': 'English Language Live Online School',
    'hero.badge': 'Plataforma de inglés online', 'hero.title1': 'Habla inglés', 'hero.title2': 'con confianza',
    'hero.sub': 'Cursos diseñados por expertos, seguimiento académico y una experiencia visual moderna para estudiantes y docentes.',
    'hero.priceOld': 'S/239/año', 'hero.priceNow': 'S/119.50/año', 'hero.priceNote': '50% de descuento', 'hero.only': 'Solo',
    'hero.cta': 'Comenzar gratis', 'hero.explore': 'Explorar cursos', 'hero.students': 'estudiantes activos',
    'hero.card1Title': 'Business English Pro', 'hero.card1Sub': 'Certificación reconocida', 'hero.card2Label': 'Progreso', 'hero.discount': 'de descuento hoy',
    'feat.1.t': 'Clases online', 'feat.1.d': 'Sesiones en vivo por Zoom con docentes certificados.',
    'feat.2.t': 'Seguimiento académico', 'feat.2.d': 'Progreso, notas y evaluaciones siempre a la vista.',
    'feat.3.t': 'Certificados', 'feat.3.d': 'Certificados de nivel con código de verificación único.',
    'cat.title': 'Nuestros cursos', 'cat.subtitle': 'Elige tu nivel y empieza hoy. Los niveles siguen el Marco Común Europeo (MCER).',
    'cat.all': 'Todos', 'cat.general': 'General', 'cat.business': 'Business', 'cat.exams': 'Exámenes', 'cat.tech': 'Tech',
    'cat.empty': 'No encontramos cursos para tu búsqueda.', 'cat.clear': 'Limpiar búsqueda', 'cat.enroll': 'Matricularme',
    'cat.level': 'Nivel', 'cat.priceAsk': 'Precio al matricularte', 'cat.results': 'curso(s) encontrado(s)',
    'cat.legend': 'MCER: A1-A2 principiante · B1-B2 intermedio · C1 avanzado',
    'footer.rights': 'Todos los derechos reservados.',
    'auth.registerTitle': 'Crea tu cuenta', 'auth.registerSub': 'Empieza a aprender inglés hoy. Es gratis.',
    'auth.fullName': 'Nombre y apellidos completos', 'auth.fullNamePh': 'Ej. María Fernanda López Rojas',
    'auth.email': 'Correo electrónico', 'auth.password': 'Contraseña', 'auth.confirm': 'Confirmar contraseña',
    'auth.passwordHint': 'Mínimo 8 caracteres, con letras y números.', 'auth.country': 'País', 'auth.countryPh': 'Selecciona tu país',
    'auth.group.latam': 'Latinoamérica', 'auth.group.na_es': 'EE.UU. y España', 'auth.group.global': 'Global', 'auth.global': 'Otro país (global)',
    'auth.submitRegister': 'Crear cuenta', 'auth.creating': 'Creando cuenta...', 'auth.haveAccount': '¿Ya tienes cuenta?', 'auth.loginLink': 'Inicia sesión',
    'auth.loginTitle': 'Inicia sesión', 'auth.loginSub': 'Bienvenido de nuevo.', 'auth.submitLogin': 'Ingresar', 'auth.signingIn': 'Ingresando...',
    'auth.noAccount': '¿Aún no tienes cuenta?', 'auth.registerLink': 'Regístrate gratis', 'auth.show': 'Mostrar', 'auth.hide': 'Ocultar',
    'auth.close': 'Cerrar', 'auth.pending': 'Al registrarte continuarás con la matrícula en',
    'auth.confirmEmail': 'Te enviamos un correo de confirmación. Confírmalo y luego inicia sesión para continuar.',
    'err.name': 'Ingresa tu nombre y apellidos completos (mínimo 2 palabras).', 'err.email': 'Ingresa un correo electrónico válido.',
    'err.password': 'La contraseña debe tener mínimo 8 caracteres, con letras y números.', 'err.mismatch': 'Las contraseñas no coinciden.',
    'err.country': 'Selecciona tu país.', 'err.exists': 'Este correo ya está registrado. Inicia sesión.',
    'err.invalid': 'Correo o contraseña incorrectos.', 'err.generic': 'No se pudo completar la operación. Inténtalo nuevamente.',
    'err.config': 'La conexión con Supabase no está configurada.', 'err.inactive': 'Tu cuenta está inactiva.',
    'ok.match': 'Las contraseñas coinciden.'
  },
  en: {
    'nav.courses': 'Courses', 'nav.search': 'Search English courses...', 'nav.login': 'Log in', 'nav.start': 'Start for free',
    'nav.dashboard': 'My dashboard', 'nav.logout': 'Log out', 'nav.lang': 'Language', 'nav.brandSub': 'English Language Live Online School',
    'hero.badge': 'Online English platform', 'hero.title1': 'Speak English', 'hero.title2': 'with confidence',
    'hero.sub': 'Expert-designed courses, academic tracking and a modern experience for students and teachers.',
    'hero.priceOld': 'S/239/year', 'hero.priceNow': 'S/119.50/year', 'hero.priceNote': '50% off', 'hero.only': 'Only',
    'hero.cta': 'Start for free', 'hero.explore': 'Explore courses', 'hero.students': 'active students',
    'hero.card1Title': 'Business English Pro', 'hero.card1Sub': 'Recognized certification', 'hero.card2Label': 'Progress', 'hero.discount': 'off today',
    'feat.1.t': 'Online classes', 'feat.1.d': 'Live Zoom sessions with certified teachers.',
    'feat.2.t': 'Academic tracking', 'feat.2.d': 'Progress, grades and assessments always in sight.',
    'feat.3.t': 'Certificates', 'feat.3.d': 'Level certificates with a unique verification code.',
    'cat.title': 'Our courses', 'cat.subtitle': 'Pick your level and start today. Levels follow the Common European Framework (CEFR).',
    'cat.all': 'All', 'cat.general': 'General', 'cat.business': 'Business', 'cat.exams': 'Exams', 'cat.tech': 'Tech',
    'cat.empty': 'No courses match your search.', 'cat.clear': 'Clear search', 'cat.enroll': 'Enroll',
    'cat.level': 'Level', 'cat.priceAsk': 'Price shown at enrollment', 'cat.results': 'course(s) found',
    'cat.legend': 'CEFR: A1-A2 beginner · B1-B2 intermediate · C1 advanced',
    'footer.rights': 'All rights reserved.',
    'auth.registerTitle': 'Create your account', 'auth.registerSub': 'Start learning English today. It is free.',
    'auth.fullName': 'Full name and surnames', 'auth.fullNamePh': 'e.g. Maria Fernanda Lopez Rojas',
    'auth.email': 'Email address', 'auth.password': 'Password', 'auth.confirm': 'Confirm password',
    'auth.passwordHint': 'At least 8 characters, with letters and numbers.', 'auth.country': 'Country', 'auth.countryPh': 'Select your country',
    'auth.group.latam': 'Latin America', 'auth.group.na_es': 'USA and Spain', 'auth.group.global': 'Global', 'auth.global': 'Other country (global)',
    'auth.submitRegister': 'Create account', 'auth.creating': 'Creating account...', 'auth.haveAccount': 'Already have an account?', 'auth.loginLink': 'Log in',
    'auth.loginTitle': 'Log in', 'auth.loginSub': 'Welcome back.', 'auth.submitLogin': 'Log in', 'auth.signingIn': 'Signing in...',
    'auth.noAccount': "Don't have an account yet?", 'auth.registerLink': 'Sign up for free', 'auth.show': 'Show', 'auth.hide': 'Hide',
    'auth.close': 'Close', 'auth.pending': 'After signing up you will continue enrolling in',
    'auth.confirmEmail': 'We sent you a confirmation email. Confirm it and then log in to continue.',
    'err.name': 'Enter your full name and surnames (at least 2 words).', 'err.email': 'Enter a valid email address.',
    'err.password': 'Password must have at least 8 characters, with letters and numbers.', 'err.mismatch': 'Passwords do not match.',
    'err.country': 'Select your country.', 'err.exists': 'This email is already registered. Please log in.',
    'err.invalid': 'Incorrect email or password.', 'err.generic': 'The operation could not be completed. Please try again.',
    'err.config': 'The Supabase connection is not configured.', 'err.inactive': 'Your account is inactive.',
    'ok.match': 'Passwords match.'
  }
}

export const t = (lang, key) => D[lang]?.[key] ?? D.es[key] ?? key

export function loadLang() {
  try { const v = localStorage.getItem('lingova_lang'); if (v === 'es' || v === 'en') return v } catch { /* sin storage */ }
  return (typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('en')) ? 'en' : 'es'
}
export function saveLang(l) { try { localStorage.setItem('lingova_lang', l) } catch { /* sin storage */ } }
