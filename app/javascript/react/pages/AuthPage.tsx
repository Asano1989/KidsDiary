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
  const handleAuthSuccess = useCallback(async ({
    session,
    displayName,
    birthday,
    avatarFile
  }: {
    session: Session,
    displayName?: string,
    birthday?: string,
    avatarFile?: File | null
  }) => {
    // 1. ブロック判定: 名前や画像がある場合は、フラグを無視して実行（新規登録時用）
    const isExplicitUpdate = !!(displayName || avatarFile);
    if (railsSyncedRef.current && !isExplicitUpdate) return true;

    try {
      // 2. データの準備 (FormData)
      const formData = new FormData();
      formData.append('user[supabase_uid]', session.user.id);
      formData.append('user[email]', session.user.email || '');
      if (displayName) formData.append('user[name]', displayName);
      if (birthday) formData.append('user[birthday]', birthday);
      if (avatarFile) formData.append('user[avatar]', avatarFile);

      // 3. Railsへの同期 (register_on_rails)
      const response = await fetch('/api/v1/users/register_on_rails', {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data' は絶対に書かない
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        console.error("Rails Registration Failed");
        return false;
      }

      // 4. RailsのCookie設定 (set_cookie)
      const RAIL_API_BASE = process.env.REACT_APP_RAILS_API_BASE_URL || '';
      const setCookieApiUrl = `${RAIL_API_BASE}/auth/set_cookie`;
      
      const cookieResponse = await fetch(setCookieApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt_token: session.access_token }),
      });

      if (!cookieResponse.ok) {
        console.error('Rails Cookie error');
      }

      // 5. 表示用のプロファイル取得 (Supabaseのprofilesテーブルから)
      const MAX_ATTEMPTS = 5;
      const DELAY_MS = 500;
      let profileName = displayName || session.user.email || 'ユーザー';

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();

        if (data?.name) {
          profileName = data.name;
          break;
        }
        if (i < MAX_ATTEMPTS - 1) await new Promise(res => setTimeout(res, DELAY_MS));
      }

      // 6. 状態の更新
      setUserProfile({ name: profileName, supabaseUid: session.user.id });
      setRailsSynced(true);
      
      return true;
    } catch (error) {
      console.error('Auth Success 処理中にエラー:', error);
      return false;
    }
  }, []);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldForceSignout = urlParams.get('force_signout') === 'true';

    if (shouldForceSignout) {
        // Rails側でログアウトされた場合、Supabaseセッションも強制的に破棄
        supabase.auth.signOut();
        
        // URLからパラメータを削除し、リロード後に二度実行されるのを防ぐ
        window.history.replaceState(null, '', window.location.pathname);
    }

    // 1. Supabaseのイベントリスナー
    const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          setSession(session);
          setLoading(false);

          if (session) {
            // SIGNED_UP（新規登録直後）は自動同期を絶対に行わず、SignUpForm 側の処理にすべて任せる
            if (event === 'SIGNED_UP') {
              console.log("Blocking automatic sync for SIGNED_UP event");
              return;
            }

            // 通常のログイン（SIGNED_IN）時のみ、Railsと同期する
            if (event === 'SIGNED_IN' && !railsSyncedRef.current) {
              // 既存ユーザーのログイン時は画像などは不要なので空でOK
              handleAuthSuccess({ session });
              railsSyncedRef.current = true;
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
        
        // 3. ログアウト処理完了後、ルートページへ強制リロード
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
            onToggleForm={async (name, bday, file) => {
              setIsSignIn(true);
              const { data: { session: newSession } } = await supabase.auth.getSession();
              
              if (newSession) {
                console.log("Passing to handleAuthSuccess:", { name, bday, hasFile: !!file });
                await handleAuthSuccess({
                  session: newSession,
                  displayName: name,
                  birthday: bday,
                  avatarFile: file
                });
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