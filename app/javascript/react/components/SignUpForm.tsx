import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SignUpFormProps {
  onToggleForm: (displayName?: string, birthday?: string) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // パスワード確認
  const [displayName, setDisplayName] = useState(''); // 表示名 (変更)
  const [birthday, setBirthday] = useState(''); // 誕生日（任意）
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // パスワード確認用ヘルパー関数 (既存ロジックから簡略化)
  const waitForSession = async (maxAttempts = 5, delay = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return session.user;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const nameValue = displayName;
    const birthdayValue = birthday;

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。');
      setLoading(false);
      return;
    }

    try {
      // 1. Supabaseでユーザー登録を実行
      const { error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) throw signUpError;
      
      // 2. プロファイルデータ（表示名、誕生日）をProfilesテーブルに登録
      const user = await waitForSession();
      
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name: displayName.trim(),
              birthday: birthday || null,
            },
          ]);
        
        if (profileError) {
          console.error("Profile creation failed:", profileError);
          throw new Error('ユーザー認証は完了しましたが、プロファイル作成に失敗しました。');
        }

        // 3. 全ての処理が成功
        setMessage('登録に成功しました。ログイン画面へ移動します。');
        onToggleForm(displayName, birthday); // ログイン画面へ遷移
        
      } else {
        // メール検証が必要でセッションが確立されていない場合
        setMessage('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
      }

    } catch (err) {
      console.error('Sign Up Error:', err);
      setError('登録中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">ユーザー登録</h2>
      
      {message && <p className="text-sm text-gray-700 p-2 bg-gray-100 rounded">{message}</p>}
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

      {/* パスワード（確認） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="passwordConfirm">パスワード（確認）</label>
        <input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          className="w-full p-2 border border-gray-400 rounded-lg focus:ring-gray-600 focus:border-gray-600"
        />
      </div>

      {/* 表示名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="displayName">表示名</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-2 border border-gray-400 rounded-lg focus:ring-gray-600 focus:border-gray-600"
        />
      </div>

      {/* 誕生日（任意） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birthday">誕生日 (任意)</label>
        <input
          id="birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-full p-2 border border-gray-400 rounded-lg focus:ring-gray-600 focus:border-gray-600"
        />
      </div>

      {/* 登録ボタン */}
      <button
        type="submit"
        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? '登録中...' : '登録'}
      </button>
    </form>
  );
};

export default SignUpForm;