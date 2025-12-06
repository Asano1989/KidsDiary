import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SignInFormProps {
  onSuccess: () => void;
  onNavigate: (view: 'signup') => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabaseのログインメソッド
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      
      // 成功した場合、App.tsxのonAuthStateChangeリスナーがセッションを更新します
      onSuccess();
      
    } catch (err) {
      console.error('Sign In Error:', err);
      setError(err instanceof Error ? err.message : 'ログイン中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: 'github' | 'google') => {
    // ソーシャルログイン
    supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <form onSubmit={handleSignIn} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">ログイン</h2>
      
      {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:bg-indigo-400"
        disabled={loading}
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>

      <div className="flex items-center space-x-2 my-4">
        <hr className="flex-grow border-gray-300" />
        <span className="text-sm text-gray-500">または</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <button
        type="button"
        onClick={() => onNavigate('signup')}
        className="w-full text-sm text-indigo-600 hover:text-indigo-800 mt-2"
      >
        アカウントをお持ちでない方はこちら (新規登録)
      </button>
    </form>
  );
};

export default SignInForm;