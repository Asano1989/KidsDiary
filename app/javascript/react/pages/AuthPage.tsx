import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    avatarFile?: File;
}

const useAuthLogic = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [railsSynced, setRailsSynced] = useState(false);

  const railsSyncedRef = useRef(railsSynced);
  useEffect(() => {
    railsSyncedRef.current = railsSynced;
  }, [railsSynced]);

  // ログイン成功時にRails DBとの連携とユーザープロファイルの取得を実行
  const handleAuthSuccess = useCallback(async ({ session, displayName, birthdayValue, avatarFile }: AuthSuccessParams) => {
    if (railsSyncedRef.current) return;
  
    if (!session || !session.user) {
      console.error("Supabase Session or User is missing (in handleAuthSuccess).");
      return false;
    }

    // 暫定的なプロファイル設定
    setUserProfile({
      name: displayName || session.user.email || 'ユーザー',
      supabaseUid: session.user.id
    });

    //  session.access_token を変数として定義
    const jwtToken = session.access_token;
    
    // JWTが存在しない場合は処理を中断
    if (!jwtToken) {
        console.error("JWT Token is missing in session.");
        return;
    }
    
    const RAIL_COOKIE_KEY = 'rails_access_token';
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 有効期限: 7日間

    const formData = new FormData();
    formData.append('user[supabase_uid]', session.user.id);
    formData.append('user[email]', session.user.email || '');
    if (displayName) formData.append('user[name]', displayName);
    if (birthdayValue) formData.append('user[birthday]', birthdayValue);
    if (avatarFile) {
      formData.append('user[avatar]', avatarFile);
    }

    // jwtToken を使用 (ReferenceError解消)
    // document.cookie = `${RAIL_COOKIE_KEY}=${jwtToken}; path=/; expires=${expires.toUTCString()}; secure=${window.location.protocol === 'https:'}; samesite=Lax`;

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
            'Authorization': `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Rails連携失敗:', await response.json());
        return;
      }

      // Rails連携成功時にフラグを立てる
      // setRailsSynced(true);

      const setCookieApiUrl = `${RAIL_API_BASE ? RAIL_API_BASE : ''}/auth/set_cookie`;

      const cookieResponse = await fetch(setCookieApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt_token: jwtToken }), // JWTをペイロードとして送信
      });
      
      if (!cookieResponse.ok) {
          console.error('RailsでのCookie設定に失敗:', await cookieResponse.json());
          // 処理を継続するか、エラーで中断するかは判断によります
      }

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

      if (profile) {
        setUserProfile({ name: profile.name, supabaseUid: user.id });
        return true; // 成功
      } else {
        console.error('最終的にプロファイル取得失敗:', profileError);
        setUserProfile({ name: user.email || '名無し', supabaseUid: user.id });
        return false;
      }
    } catch (error) {
      console.error('Auth Success 処理中に予期せぬエラー:', error);
      return false;
    }
    return true;
  }, []);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldForceSignout = urlParams.get('force_signout') === 'true';

    if (shouldForceSignout) {
        // Rails側でログアウトされた場合、Supabaseセッションも強制的に破棄
        supabase.auth.signOut();
        
        // 💡 URLからパラメータを削除して、リロード後に二度実行されるのを防ぐ
        window.history.replaceState(null, '', window.location.pathname);
    }

    // 1. Supabaseのイベントリスナー
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          setRailsSynced(false);
          setUserProfile(null);
          return;
        }

        if (session) {
          // 💡 ログイン/登録時、またはセッション初期化時で、まだRails連携が試行されていなければ実行
          if ((event === 'SIGNED_IN' || event === 'SIGNED_UP') || (event === 'INITIAL_SESSION' && !railsSynced)) {
                
            // 既にRails連携が進行中または成功している場合は中断（最後の防衛線）
            if (railsSynced) return;

            // 💡 まずフラグを立てて、重複イベントからの呼び出しをブロック
            setRailsSynced(true);

            const success = await handleAuthSuccess({ session });

            // handleAuthSuccessが失敗した場合のみ、フラグをリセットしてリトライを可能にする
            if (!success) {
              console.error('handleAuthSuccess 失敗。Rails同期フラグをリセット。');
              setRailsSynced(false);
            }
            
            // 💡 ログイン/登録完了後、ルートへリダイレクトし、即座に画面を更新
            if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
              window.location.href = '/';
            }
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [railsSynced, handleAuthSuccess]);

  // ログアウト処理
  const handleSignOut = async () => {
    if (window.confirm('ログアウトしますか？')) {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('ログアウト失敗:', error);
        alert('ログアウト中にエラーが発生しました。');
      } else {
        // ログアウト成功時
        const RAIL_COOKIE_KEY = 'rails_access_token';

        // 1. Rails用のCookieを削除
        document.cookie = `${RAIL_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure=${window.location.protocol === 'https:'}; samesite=Lax`;

        // 2. ローカルの状態をリセット
        setRailsSynced(false);
        
        // 💡 修正点: ログアウト処理完了後、ルートページへ強制リロード
        window.location.href = '/';
      }
    } else {
      setLoading(false);
    }
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
      <div className="h-full flex items-center justify-center text-gray-700">
        ロード中...
      </div>
    );
  }

  // --- ログイン後の表示 ---
  if (session) {
    // 1. profiles.name 2. Supabaseユーザーのメールアドレス 3. 'ユーザー'
    const displayName = userProfile?.name || session.user.email || 'ユーザー';

    return (
      <div className="h-full w-full max-w-md mx-auto">
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
            onToggleForm={async (displayName, birthdayValue) => {
              setIsSignIn(true);

              // セッションを再取得し、取得できたら公開された handleAuthSuccess を呼び出す
              const { data: { session: newSession } } = await supabase.auth.getSession();
              
              if (newSession) {
                await handleAuthSuccess({ session: newSession, displayName, birthdayValue });
                // handleAuthSuccess の完了を待たずに、すぐにページを移動したい場合:
                // window.location.href = '/';
              }
            }}
          />
        )}

      <div className="h-full w-full mt-4 text-center">
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