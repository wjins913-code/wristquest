import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlfygsocrtdujnuzcoeu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1yugKVQHVrQBLGnJ5soOOw_GCubIm5t';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
