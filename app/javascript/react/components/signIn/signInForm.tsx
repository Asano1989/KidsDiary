import React, { useState, FormEvent } from 'react';
import { supabase } from '../../supabaseClient'; 

const SignInForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(`ログインエラー: ${error.message}`);
    } else if (data.session) {
      // ログイン成功
      // data.session.access_token に JWT が含まれている
      setMessage('ログインに成功しました。データの連携を開始します。');
      
      // Rails APIを呼び出して連携処理を行う
      await handleInitialRailsSync(data.session.access_token);
      
    } else {
      setMessage('予期せぬエラーが発生しました。');
    }

    setLoading(false);
  };

  const handleInitialRailsSync = async (jwtToken: string) => {
    try {
      // 連携用のRailsエンドポイントへリクエスト
      const response = await fetch('/api/v1/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // AuthorizationヘッダーにJWTをBearerトークンとして含める
          'Authorization': `Bearer ${jwtToken}`,
        },
        // ボディは空でも良いが、必要に応じてメールアドレスなどを渡す
        body: JSON.stringify({ email: email }),
      });

      if (!response.ok) {
        // Rails側で連携登録に失敗した場合
        const errorData = await response.json();
        console.error('Rails連携エラー:', errorData);
        // ユーザーには目立たないエラーとして扱うことが多い
      } else {
        console.log('Rails DBとのユーザー連携が完了しました。');
        // 画面遷移など
      }
    } catch (error) {
      console.error('ネットワークエラー:', error);
    }
  };
  
  return (
    <form onSubmit={handleSignUp}>
      <h2>ログイン (Sign In)</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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

export default SignInForm;