import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 環境変数を参照
const supabaseUrl: string = process.env.SUPABASE_URL!;
const supabaseAnonKey: string = process.env.YOUR_SUPABASE_ANON_KEY!;

// Supabaseクライアントのインスタンスを作成
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);
