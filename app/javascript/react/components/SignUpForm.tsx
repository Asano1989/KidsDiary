import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SignUpFormProps {
  onSuccess: () => void;
  onNavigate: (view: 'signin') => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Supabaseの新規登録メソッド
      // 🚨 変更: dataオプションを追加し、名前と誕生日をユーザーメタデータとして保存します。
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      }, {
        data: {
          full_name: name,
          birthday: birthday,
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // サインアップが成功しても、メール確認が必須の場合はセッションは得られない
      if (data.user) {
        setMessage('登録に成功しました。ログインしてください。');
        onNavigate('signin');
      } else {
        setMessage('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
        setEmail('');
        setPassword('');
        // フォームをリセット
        setName('');
        setBirthday('');
      }
      onSuccess();

    } catch (err) {
      console.error('Sign Up Error:', err);
      setError(err instanceof Error ? err.message : '登録中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">新規登録</h2>
      
      {message && <p className="text-sm text-green-600 p-2 bg-green-50 rounded">{message}</p>}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">名前</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birthday">誕生日</label>
        <input
          id="birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:bg-indigo-400"
        disabled={loading}
      >
        {loading ? '登録中...' : '登録'}
      </button>

      <button
        type="button"
        onClick={() => onNavigate('signin')}
        className="w-full text-sm text-indigo-600 hover:text-indigo-800 mt-2"
      >
        すでにアカウントをお持ちの方はこちら (ログイン)
      </button>
    </form>
  );
};

export default SignUpForm;