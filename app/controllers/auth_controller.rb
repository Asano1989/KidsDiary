class AuthController < ApplicationController
  def index
    current_user
  end

  def destroy
    is_secure = request.protocol == 'https://'
    
    # 本番環境でのみ secure: true にする場合
    # is_secure = Rails.env.production?

    # 1. Rails側で使用しているCookieキーを削除
    cookie_options = {
      path: '/',
      same_site: :lax,
      secure: is_secure
    }

    cookies.delete(:rails_access_token, cookie_options)
    
    # 2. メモ化された @current_user を明示的にリセットする
    #    次のリクエストで current_user が呼ばれた際に、認証ロジックを強制的に再実行させるため
    @current_user = nil

    # 3. フラッシュメッセージを設定
    flash[:notice] = "ログアウトしました。"
    
    # 4. ページ全体を強制的にリロードさせるリダイレクト
    redirect_to auth_path(force_signout: true), status: :see_other
  end

  def set_cookie
    # 1. JWTトークンをクッキーにセットする処理 (現状の実装)
    cookies[:rails_access_token] = {
      value: auth_params[:jwt_token],
      # secure: Rails.env.production?, # 環境に応じて設定
      # httponly: true,                # XSS対策として推奨
      expires: 1.hour.from_now,        # 適切な期限を設定
      domain: :all                     # 環境に合わせて調整
    }

    # 2. 成功後、必ずクライアントにリダイレクトを指示
    # ブラウザは新しいクッキーを付けて '/' にアクセスする
    redirect_to root_path, status: :see_other
  end

  private

  def auth_params
    params.require(:auth).permit(:jwt_token)
  end
end