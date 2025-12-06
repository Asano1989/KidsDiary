import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

// フォームコンポーネントをインポート
import SignInForm from '../components/SignInForm';
import SignUpForm from '../components/SignUpForm';

// ビュー切り替えの型
type View = 'signin' | 'signup' | 'authenticated';

// 認証済みAPIから取得するアイテムの型定義
interface Item {
  id: number;
  name: string;
}

// 認証済みAPIからのレスポンス型定義
interface ApiData {
  message: string;
  user_id: string;
  items: Item[];
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 認証状態に基づいて初期ビューを設定
  const initialView: View = session ? 'authenticated' : 'signin';
  const [currentView, setCurrentView] = useState<View>(initialView);


  // 1. 認証状態の監視とセッションの取得
  useEffect(() => {
    // 初回ロード時のセッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setCurrentView('authenticated');
      }
    });

    // 認証状態の変更をリアルタイムで監視するリスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      if (session) {
        setCurrentView('authenticated');
      } else if (_event === 'SIGNED_OUT') {
        setCurrentView('signin');
        setApiData(null); // ログアウト時にデータをリセット
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. JWTを使った認証済みAPIへのリクエスト関数 (前回のコードから変更なし)
  const fetchAuthenticatedData = async (token: string) => {
    setLoading(true);
    setError(null);
    setApiData(null);

    const apiUrl = '/api/v1/items';

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API Request failed: ${response.status} - ${errorBody.error || 'Unknown error'}`);
      }

      const data: ApiData = await response.json();
      setApiData(data);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  // 3. 認証情報が更新されたときにAPIを呼び出す
  useEffect(() => {
    if (session?.access_token && currentView === 'authenticated') {
      fetchAuthenticatedData(session.access_token);
    } else {
      setApiData(null);
    }
  }, [session, currentView]); // sessionとビューが変わるたびに実行

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
    setCurrentView('signin');
  };
  
  // 認証済みコンテンツのコンポーネント
  const AuthenticatedContent: React.FC = () => {
    const user = session?.user;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">ようこそ、{user?.email || 'ユーザー'}様！</h2>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            disabled={loading}
          >
            ログアウト
          </button>
        </div>

        {/* APIリクエスト結果の表示 */}
        <h3 className="text-xl font-semibold text-gray-700">Rails API レスポンス (認証後データ)</h3>
        
        {loading && (
          <div className="flex items-center justify-center space-x-2 text-indigo-600 p-8 bg-gray-50 rounded-lg">
             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             <span>データを取得中...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
            <p className="font-bold">API通信エラー:</p>
            <p className="break-words">{error}</p>
          </div>
        )}

        {apiData && (
          <div className="p-6 bg-green-50 rounded-lg border border-green-300">
            <p className="text-green-800 font-bold mb-2">メッセージ: {apiData.message}</p>
            <p className="text-green-800 mb-4">Rails側で検証されたユーザーID: <span className="font-mono">{apiData.user_id}</span></p>

            <h4 className="text-lg font-semibold text-green-700 mt-4 mb-2">認証済みアイテムリスト:</h4>
            <ul className="list-disc list-inside space-y-1">
              {apiData.items.map(item => (
                <li key={item.id} className="text-gray-700">
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // ローディング中は何も表示しない
  if (loading && !session) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-md mt-10">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-8">
          Supabase & Rails Auth
        </h1>

        {currentView === 'signin' && (
          <SignInForm 
            onSuccess={() => setCurrentView('authenticated')} 
            onNavigate={() => setCurrentView('signup')}
          />
        )}
        
        {currentView === 'signup' && (
          <SignUpForm 
            onSuccess={() => { /* 登録完了後の処理 */ }} 
            onNavigate={() => setCurrentView('signin')}
          />
        )}
        
        {currentView === 'authenticated' && <AuthenticatedContent />}
      </div>
    </div>
  );
};

export default App;