import { createClient } from '@supabase/supabase-js';

// 環境変数から値を取得
const supabaseUrl: string = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey: string = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// createClient 関数は SupabaseClient 型のオブジェクトを返す
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);