import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SignInFormProps {
  onToggleForm: () => void; // ログイン/登録切り替え用
}

const SignInForm: React.FC<SignInFormProps> = ({ onToggleForm }) => {
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
      
      // 成功した場合、AuthPageのonAuthStateChangeリスナーが処理を引き継ぐ
      // フォームをリセット
      setEmail('');
      setPassword('');

    } catch (err) {
      console.error('Sign In Error:', err);
      setError(err instanceof Error ? err.message : 'ログイン中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">ログイン</h2>
      
      {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded">{error}</p>}

      {/* メールアドレス */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded-lg focus:ring-gray-600 focus:border-gray-600"
        />
      </div>

      {/* パスワード */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded-lg focus:ring-gray-600 focus:border-gray-600"
        />
      </div>

      {/* ログインボタン */}
      <button
        type="submit"
        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
};

export default SignInForm;