import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Session, AuthChangeEvent } from '../supabaseClient';
import SignUpForm from '../components/SignUpForm';
import SignInForm from '../components/SignInForm';

interface UserProfile {
  name: string;
  supabaseUid: string;
}

// AuthSuccessParams の定義は問題ありません
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
      console.error("Supabase Session or User is missing (in handleAuthSuccess).");
      return;
    }

    // 💡 修正 1: session.access_token を変数として定義
    const jwtToken = session.access_token;
    
    // JWTが存在しない場合は処理を中断 (念のため)
    if (!jwtToken) {
        console.error("JWT Token is missing in session.");
        return;
    }
    
    const RAIL_COOKIE_KEY = 'rails_access_token';
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 有効期限: 7日間

    // 💡 修正 2: jwtToken を使用 (ReferenceError解消)
    document.cookie = `${RAIL_COOKIE_KEY}=${jwtToken}; path=/; expires=${expires.toUTCString()}; secure=${window.location.protocol === 'https:'}; samesite=Lax`;

    // 1. Rails連携（/api/v1/users/register_on_rails へPOST）
    const body: { user: { supabase_uid: string, email: string | undefined, name?: string, birthday?: string } } = {
        user: {
            supabase_uid: session.user.id,
            email: session.user.email,
        }
    };

    if (displayName) body.user.name = displayName;
    if (birthdayValue) body.user.birthday = birthdayValue;

    const RAIL_API_BASE = process.env.REACT_APP_RAILS_API_BASE_URL || ''; // デフォルト値を追加
    // RAIL_API_BASE が undefined の場合に備えてチェック
    const apiUrl = RAIL_API_BASE ? `${RAIL_API_BASE}/api/v1/users/register_on_rails` : '/api/v1/users/register_on_rails';


    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`, // 💡 jwtToken を使用
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('Rails連携失敗:', await response.json());
        return;
      }

      // Rails連携成功時にフラグを立てる
      setRailsSynced(true);

      // 2. Supabaseからprofilesテーブルの表示名を取得
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
        setLoading(false);

          if (session) {
            if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
              // session のみを渡す (displayName/birthdayValueは空)
              handleAuthSuccess({ session });
            }
             // 💡 修正 3: リロードなど、セッション復元時にも handleAuthSuccess を呼び出す
            if (event === 'INITIAL_SESSION' && !railsSynced) {
              handleAuthSuccess({ session });
            }
          }
        }
      );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleAuthSuccess, railsSynced]);

  // ログアウト処理
  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('ログアウト失敗:', error);
      alert('ログアウト中にエラーが発生しました。');
    } else {
        // ログアウト成功時
        const RAIL_COOKIE_KEY = 'rails_access_token';
        
        // 1. Rails用のCookieを削除 (有効期限を過去にする)
        document.cookie = `${RAIL_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure=${window.location.protocol === 'https:'}; samesite=Lax`;
        
        // 2. ローカルの状態をリセット
        setRailsSynced(false);
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
        {/* Myページへのリンクを追加 */}
        <div className="mt-4 text-center">
            <a href="/mypage" className="text-sm text-blue-600 hover:text-blue-800">
                → マイページへ移動
            </a>
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
                  // handleAuthSuccess は { session, displayName, birthdayValue } を引数として取るように定義を変更
                  handleAuthSuccess({ 
                        session: newSession, 
                        displayName: displayName, 
                        birthdayValue: birthdayValue 
                    });
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