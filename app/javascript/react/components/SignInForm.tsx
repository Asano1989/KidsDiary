import React, { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient';

interface SignInFormProps {
  onToggleForm: () => void;
  // ログイン成功時にホーム画面などへリダイレクトするための関数
  onSignInSuccess: (jwtToken: string) => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onToggleForm, onSignInSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Supabaseでログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMessage(`ログインエラー: ${error.message}`);
      } else if (data.session) {
        // ログイン成功
        setMessage('ログインに成功しました...');
        
        // 外部で定義された連携処理と成功後のリダイレクトを実行
        // data.session.access_token (JWT) を渡す
        onSignInSuccess(data.session.access_token);
        
      } else {
        setMessage('予期せぬエラーが発生しました。');
      }
    } catch (err) {
      setMessage('予期せぬエラーが発生しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-xl rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">ログイン</h2>
      
      <form onSubmit={handleSignIn} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full p-3 text-white font-semibold rounded-lg transition duration-150 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? '認証中...' : 'ログイン'}
        </button>
      </form>

      {message && (
        <p className={`mt-4 p-2 text-center rounded ${message.startsWith('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        アカウントをお持ちでない場合は 
        <button 
          type="button" 
          onClick={onToggleForm}
          className="text-green-600 hover:text-green-800 font-medium ml-1"
        >
          新規登録
        </button>
      </p>
    </div>
  );
};

export default SignInForm;