import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 環境変数の設定
const supabaseUrl: string = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey: string = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// 環境変数が設定されているか確認
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key environment variables are missing.');
}

// createClient の結果を明示的に SupabaseClient 型として定義してエクスポート
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);