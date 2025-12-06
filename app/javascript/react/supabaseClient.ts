import { createClient } from '@supabase/supabase-js';

// 開発環境と本番環境で自動的に切り替わるよう、環境変数から値を取得
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 必須の環境変数が設定されていない場合はエラーをスロ
if (!supabaseUrl || !supabaseAnonKey) {
  // 開発環境でエラーに気づきやすくするため
  console.error("Supabase environment variables are missing!");
  // アプリケーションを停止させるか、安全な代替手段を提供
  throw new Error("Missing Supabase URL or Anon Key. Please check your .env configuration.");
}

// Supabaseクライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey);