import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gswdafmvccbstojgaxlc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_D1fcFW6YS17uCqAH4YpMRg_EwyacCDJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
