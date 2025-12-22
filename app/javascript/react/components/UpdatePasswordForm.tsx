import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const UpdatePasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(error.message);
    } else {
      alert('パスワードを更新しました。');
      window.location.href = '/auth'; // 完了後に再読み込み
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdate} className="bg-white p-6 shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-bold">新しいパスワードを設定</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="新しいパスワード"
        className="w-full p-2 border border-gray-400 rounded-lg"
      />
      <button type="submit" disabled={loading} className="w-full bg-gray-800 text-white p-2 rounded-lg">
        パスワードを更新
      </button>
    </form>
  );
};

export default UpdatePasswordForm;