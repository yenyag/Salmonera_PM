import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://bdtozcxgocpmimhpubqs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdG96Y3hnb2NwbWltaHB1YnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjkxMjUsImV4cCI6MjA2NzI0NTEyNX0.TOtWtYU7o3QEb730EaGabIHksr6CUP9EvuHg2AaniR4'

export const supabase = createClient(supabaseUrl, supabaseKey)