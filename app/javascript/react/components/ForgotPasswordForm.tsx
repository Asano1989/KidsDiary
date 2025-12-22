import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // redirectTo は Rails側のルート（/auth）を指定
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      alert(error.message);
    } else {
      setMessage('再設定用のメールを送信しました。');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-bold">パスワード再設定</h2>
      {message ? (
        <p className="text-green-600 text-sm">{message}</p>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-400 rounded-lg"
          />
          <button type="submit" disabled={loading} className="w-full bg-gray-800 text-white p-2 rounded-lg">
            送信する
          </button>
        </form>
      )}
      <button onClick={onBack} className="text-sm text-gray-600 w-full text-center">戻る</button>
    </div>
  );
};

export default ForgotPasswordForm;