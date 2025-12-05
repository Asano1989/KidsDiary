import React, { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient'; // 仮のパス -> src/supabaseClient.tsを指す

// 親コンポーネントから表示を切り替えるためのコールバックを受け取る
interface SignUpFormProps {
  onToggleForm: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleForm }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Supabaseでユーザーを登録
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setMessage(`エラー: ${error.message}`);
      } else {
        setMessage('登録が完了しました。認証メールを確認してください。');
        setEmail(''); // フォームをクリア
        setPassword('');
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">新規ユーザー登録</h2>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="パスワード (6文字以上)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full p-3 text-white font-semibold rounded-lg transition duration-150 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>

      {message && (
        <p className={`mt-4 p-2 text-center rounded ${message.startsWith('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        アカウントをお持ちの場合は 
        <button 
          type="button" 
          onClick={onToggleForm}
          className="text-blue-600 hover:text-blue-800 font-medium ml-1"
        >
          ログイン
        </button>
      </p>
    </div>
  );
};

export default SignUpForm;