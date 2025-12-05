import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FormEvent } from 'react';

const SignUpForm: React.FC = () => {
  // 仮の関数シグネチャ (Reactコンポーネント内で使用する場合の例)
  type SignUpProps = {
    email: string;
    password: string;
    setLoading: (loading: boolean) => void;
    setMessage: (message: string) => void;
  };

// 仮のコンポーネント（またはカスタムフック）内で実行される関数
  const handleSignUp = async ({ email, password, setLoading, setMessage }: SignUpProps) => {
    setLoading(true);
    setMessage('');

    try {
      // SupabaseのsignUpメソッドを呼び出す
      // errorオブジェクトの型は、@supabase/supabase-js によって定義されている
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        // 必要に応じて options追加
      });

      if (error) {
        // エラーオブジェクトは null でないことが保証される
        setMessage(`エラー: ${error.message}`);
      } else {
        // 登録成功
        setMessage('登録が完了しました。認証メールを確認してください。');
        
        // 注意：デフォルトではメール認証が必要
      }
    } catch (err) {
      // err が Error オブジェクトであることをチェック
      if (err instanceof Error) {
          setMessage(`予期せぬエラーが発生しました: ${err.message}`);
      } else {
          setMessage('予期せぬエラーが発生しました。');
      }
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <h2>ユーザー登録 (Sign Up)</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)} // e.target.valueは自動的にstringと推論されます
        required
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '登録中...' : '登録'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default SignUpForm;