import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SignUpFormProps {
  onSuccess: () => void;
  onNavigate: (view: 'signin') => void;
}

// ユーザーのセッション確立を待機するヘルパー関数
const waitForSession = async (maxAttempts = 5, delay = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return session.user;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return null;
};

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

    if (!name.trim()) {
      setError('名前は必須入力です。');
      setLoading(false);
      return;
    }

    try {
      // 1. Supabaseでユーザー登録を実行 (カスタムデータは渡さない)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }
      
      // 2. メール確認が有効な場合、確認メッセージを表示して終了
      // 注意: メール確認がない場合、この後のロジックが実行されます
      setMessage('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
      
      // 3. メール確認がない環境（またはテスト環境）で即時ログインが発生した場合の処理
      const user = await waitForSession();
      
      if (user) {
        // 認証セッションが確立されたことを確認してから profiles への挿入を試みる
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id, // 認証ユーザーのIDと一致させる
              name: name.trim(), // profiles.name に格納
              birthday: birthday || null, 
            },
          ]);
        
        if (profileError) {
          console.error("Profile creation failed (RLS/Timing issue):", profileError);
          // 認証は成功しているため、ユーザーには成功を伝えるが、
          // 開発者にはエラーを通知する
          throw new Error('ユーザー認証は完了しましたが、プロファイル作成に失敗しました。'); 
        }

        // 4. 全ての処理が成功
        setMessage('登録に成功しました。ログインしてください。');
        onNavigate('signin');

      } else {
        // メール検証が必要でセッションが確立されていない場合
        setMessage('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
      }

      // フォームをリセット
      setEmail('');
      setPassword('');
      setName('');
      setBirthday('');
      onSuccess();

    } catch (err) {
      console.error('Sign Up Error:', err);
      // RLS/Timing issue のメッセージはユーザーには見せない
      setError('登録中にエラーが発生しました。詳細はコンソールを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">新規登録</h2>
      
      {message && <p className="text-sm text-green-600 p-2 bg-green-50 rounded">{message}</p>}
      {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded">{error}</p>}

      {/* 🔽 名前入力フィールド (必須) */}
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

      {/* ... メールアドレスとパスワード ... */}
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

      {/* 🔽 誕生日入力フィールド (任意) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birthday">誕生日 (任意)</label>
        <input
          id="birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* ... 既存のボタン ... */}
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