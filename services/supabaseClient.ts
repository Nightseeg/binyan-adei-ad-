
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://shsbxtpswjwisizhplux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc2J4dHBzd2p3aXNpemhwbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjQxNDEsImV4cCI6MjA4MDk0MDE0MX0.kdOu2AlRo0K1kt515plBQs-yUDCvoYM9h6WljfGMgbs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            get 'x-shadchan-key'() { return localStorage.getItem('shadchan_key') || ''; },
            get 'x-access-code'() { return localStorage.getItem('access_code') || ''; }
        }
    }
});
