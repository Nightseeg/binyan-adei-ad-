
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            get 'x-shadchan-key'() { return localStorage.getItem('shadchan_key') || ''; },
            get 'x-access-code'() { return localStorage.getItem('access_code') || ''; }
        }
    }
});
