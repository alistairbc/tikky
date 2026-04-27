import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://huezinsdvsrwqtbvxhqk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d6JA0VJzfaVbqRWz0tn0Mw_8vXsG8z6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
