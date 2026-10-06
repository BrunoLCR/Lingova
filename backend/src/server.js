import { env } from './config/env.js'
import { createApp } from './app.js'

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn('⚠️  Falta configurar SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en backend/.env')
}

const app = createApp()
app.listen(env.PORT, () => {
  console.log(`Lingova API v2 en http://localhost:${env.PORT} (Zoom: ${env.ZOOM.mode})`)
})
