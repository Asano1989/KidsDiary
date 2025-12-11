import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Session, AuthChangeEvent } from '../supabaseClient';
import SignUpForm from '../components/SignUpForm';
import SignInForm from '../components/SignInForm';

interface UserProfile {
  name: string;
  supabaseUid: string;
}

type AuthSuccessParams = {
    session: Session;
    displayName?: string;
    birthdayValue?: string;
}

const useAuthLogic = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [railsSynced, setRailsSynced] = useState(false);

  // ログイン成功時にRails DBとの連携とユーザープロファイルの取得を実行
  const handleAuthSuccess = useCallback(async ({ session, displayName, birthdayValue }: AuthSuccessParams) => {
    if (railsSynced) return;
    
    if (!session || !session.user) {
      // セッションまたはユーザー情報がない場合は処理を中断
      console.error("Supabase Session or User is missing (in handleAuthSuccess).");
      return;
    }

    // 1. Rails連携（/api/v1/users/register_on_rails へPOST）
    // リクエストボディにsupabase_uidとemailを常に含め、displayName/birthdayValueは存在する場合のみ含める
    const body: { user: { supabase_uid: string, email: string | undefined, name?: string, birthday?: string } } = {
        user: {
            supabase_uid: session.user.id,
            email: session.user.email,
        }
    };

    if (displayName) body.user.name = displayName;
    if (birthdayValue) body.user.birthday = birthdayValue;

    const RAIL_API_BASE = process.env.REACT_APP_RAILS_API_BASE_URL;

    try {
      const response = await fetch(`${RAIL_API_BASE}/api/v1/users/register_on_rails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        // body オブジェクト全体を渡す
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('Rails連携失敗:', await response.json());
        return;
      }

      // Rails連携成功時にフラグを立てる
      setRailsSynced(true);

      // 2. Supabaseからprofilesテーブルの表示名を取得
      // handleAuthSuccess の外で最新のセッションを取得する必要はない
      const user = session.user; // 引数の session を使用

      // 3. Profiles取得
      const MAX_ATTEMPTS = 5;
      const DELAY_MS = 500;
      let profile: any = null;
      let profileError: any = null;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const result = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        profile = result.data;
        profileError = result.error;

        if (profile) {
            break;
        }

        // 406 (0 rows) の場合のみ再試行
        if (profileError && profileError.code === 'PGRST116' && i < MAX_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        } else {
          break;
        }
      }

      if (profileError || !profile) {
        console.error('最終的にプロファイル取得失敗:', profileError);
        setUserProfile({ name: user.email || '名無し', supabaseUid: user.id });
        return;
      }

      // 成功: 取得した表示名を設定
      setUserProfile({ name: profile.name, supabaseUid: user.id });

    } catch (error) {
      console.error('Auth Success 処理中に予期せぬエラー:', error);
    }
  }, [railsSynced, setRailsSynced, setUserProfile]);


  useEffect(() => {
    // 1. Supabaseのイベントリスナー
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        // ロード処理を分離
        setLoading(false);
          
          if (session) {
            if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
              // session のみを渡す (displayName/birthdayValueは空)
              handleAuthSuccess({ session });
            }
          }
        }
      );

    // 2. 初期セッションの確認（ページロード時）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // セッションが存在する場合のみ呼び出す
        handleAuthSuccess({ session });
      }
      // ロード完了
      setLoading(false);
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
     // 依存配列に handleAuthSuccess は必須
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

  return {
    session,
    userProfile,
    loading,
    handleSignOut,
    handleAuthSuccess
  };
};

const AuthPage: React.FC = () => {
  const { session, userProfile, loading, handleSignOut, handleAuthSuccess } = useAuthLogic();
  
  // true: サインインフォームを表示, false: サインアップフォームを表示
  const [isSignIn, setIsSignIn] = useState<boolean>(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        ロード中...
      </div>
    );
  }

  // --- ログイン後の表示 ---
  if (session) {
    // 1. profiles.name 2. Supabaseユーザーのメールアドレス 3. 'ユーザー'
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
            onToggleForm={(displayName, birthdayValue) => {
              setIsSignIn(true);

              // セッションを再取得し、取得できたら公開された handleAuthSuccess を呼び出す
              supabase.auth.getSession().then(({ data: { session: newSession } }) => {
                if (newSession) {
                  // AuthPage のスコープにある handleAuthSuccess を使う
                  handleAuthSuccess(newSession.access_token, displayName, birthdayValue);
                }
              });
            }}
          />
        )}

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