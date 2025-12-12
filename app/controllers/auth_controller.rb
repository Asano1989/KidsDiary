class AuthController < ApplicationController
  def index
  end

  def destroy
    # 1. Rails側で使用しているCookieキーを削除
    cookies.delete(:rails_access_token, domain: :all) # :domain => :all は必要に応じて
    
    # 2. フラッシュメッセージを設定
    flash[:notice] = "ログアウトしました。"
    
    # 3. ログインページへリダイレクト
    redirect_to root_path
  end
end