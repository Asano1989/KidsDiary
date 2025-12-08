import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import SignUpForm from '../components/SignUpForm';
import SignInForm from '../components/SignInForm';

// Supabaseセッションとユーザー情報を保持する型
interface UserProfile {
  name: string;
  supabaseUid: string;
}

// 認証ロジックと状態管理のためのカスタムフック
const useAuthLogic = () => {
  const [session, setSession] = useState<any>(null); // Supabaseセッション
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ログイン成功時にRails DBとの連携とユーザープロファイルの取得を実行
  const handleAuthSuccess = useCallback(async (jwtToken: string) => {
    console.log('認証成功。Rails連携とプロファイル取得を開始します。');
    
    // 1. Rails連携（/api/v1/users/register_on_rails へPOST）
    const response = await fetch('/api/v1/users/register_on_rails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
    });

    if (!response.ok) {
      console.error('Rails連携失敗:', await response.json());
      // 致命的なエラーではないため、ユーザーには通知せずログのみ
      return;
    }

    // 2. Supabaseからprofilesテーブルの表示名を取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('プロファイル取得失敗:', profileError);
      // profilesテーブルにデータがない場合のフォールバック（メールアドレスを表示名とする）
      setUserProfile({ name: user.email || '名無し', supabaseUid: user.id });
      return;
    }
    
    // 成功: 取得した表示名を設定
    setUserProfile({ name: profile.name, supabaseUid: user.id });

  }, []);

  // Supabaseのセッション変更を監視
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        
        if (session && event === 'SIGNED_IN') {
          // ログイン時のみRails連携/プロファイル取得を実行
          handleAuthSuccess(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          // ログアウト時はプロファイルをリセット
          setUserProfile(null);
        }
      }
    );

    // 初期セッションの確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleAuthSuccess(session.access_token);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [handleAuthSuccess]);

  // ログアウト処理
  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('ログアウト失敗:', error);
      alert('ログアウト中にエラーが発生しました。');
    }
    setLoading(false);
  };

  return { session, userProfile, loading, handleSignOut };
};


const AuthPage: React.FC = () => {
  const { session, userProfile, loading, handleSignOut } = useAuthLogic();
  
  // true: サインインフォームを表示, false: サインアップフォームを表示
  const [isSignIn, setIsSignIn] = useState<boolean>(true);

  if (loading) {
    // ロード中の最小表示
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        ロード中...
      </div>
    );
  }

  // --- ログイン後の表示（要件に基づきシンプル化） ---
  if (session) {
    // 表示名の優先順位: 1. profiles.name 2. Supabaseユーザーのメールアドレス 3. 'ユーザー'
    const displayName = userProfile?.name || session.user.email || 'ユーザー';
    
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white p-6 shadow-md rounded-lg text-center space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            **{displayName}**さんはログインしています
          </h2>
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  // --- ログイン/登録フォームの表示 ---
  return (
    <div className="w-full max-w-md mx-auto">
      {isSignIn ? (
        <SignInForm
          onToggleForm={() => setIsSignIn(false)}
        />
      ) : (
        <SignUpForm
          onToggleForm={() => setIsSignIn(true)}
        />
      )}
      {/* フォーム切り替えボタンを外部に出し、SignInForm/SignUpFormから削除 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignIn(!isSignIn)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {isSignIn ? '→ 新規登録はこちら' : '← ログインはこちら'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;