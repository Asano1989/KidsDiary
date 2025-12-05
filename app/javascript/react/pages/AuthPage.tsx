import React, { useState } from 'react';
import SignUpForm from '../components/SignUpForm';
import SignInForm from '../components/SignInForm';

// ここに初回連携処理（handleInitialRailsSync）のロジックを定義
const handleInitialRailsSync = async (jwtToken: string) => {
  console.log('JWTを使いRails DBへの連携を開始します:', jwtToken.substring(0, 20) + '...');
  
  try {
    // ⚠️ 注意: ここは実際のRailsのURLとエンドポイントに置き換えてください
    const response = await fetch('/api/v1/users/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // AuthorizationヘッダーにJWTを含める
        'Authorization': `Bearer ${jwtToken}`, 
      },
      // ボディは空でもOK
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Rails連携失敗:', errorData);
      alert('認証は成功しましたが、サーバーとの連携に失敗しました。');
      return false;
    }
    
    console.log('Rails DBとのユーザー連携が完了しました。');
    return true;

  } catch (error) {
    console.error('ネットワークエラー:', error);
    alert('ネットワークエラーにより連携に失敗しました。');
    return false;
  }
};

const AuthPage: React.FC = () => {
  // true: サインインフォームを表示, false: サインアップフォームを表示
  const [isSignIn, setIsSignIn] = useState<boolean>(true);

  // ログイン成功時に実行される関数
  const handleSignInSuccess = async (jwtToken: string) => {
    const syncSuccess = await handleInitialRailsSync(jwtToken);
    
    if (syncSuccess) {
      // 成功した場合、アプリケーションのメイン画面へ遷移（今回はコンソール出力のみ）
      console.log('認証と連携が完了しました。メイン画面へ遷移します。');
      // 実際には router.push('/dashboard') などを実行
      alert('ログインに成功し、Rails DBとの連携が完了しました！');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {isSignIn ? (
          <SignInForm 
            onToggleForm={() => setIsSignIn(false)} 
            onSignInSuccess={handleSignInSuccess}
          />
        ) : (
          <SignUpForm 
            onToggleForm={() => setIsSignIn(true)} 
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;