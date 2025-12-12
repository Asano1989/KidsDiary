class MyPagesController < ApplicationController
  before_action :require_login
    
  def show
    # require_loginが成功していれば、@current_userが利用可能
    @user = current_user
    
    # Supabaseからプロフィールデータを取得するロジックを呼び出す
    @profile_data = fetch_supabase_profile_data(@user.supabase_uid)
    
    # app/views/my_pages/show.html.erb がレンダリングされる
  end

  private

  # Supabaseからプロフィールを取得する（仮メソッド）
  def fetch_supabase_profile_data(supabase_uid)
    # 実際にはここで、SupabaseのServer API Keyを使って、
    # profilesテーブルから name や avatar_url などをフェッチする処理が入る
    
    # 例: データをフェッチするまで、メールアドレスとUIDを仮データとして返す
    {
      name: @user.email.split('@').first, # デフォルト名
      email: @user.email,
      supabase_uid: supabase_uid
    }
    
    # 開発を簡略化するため、一時的にRailsのユーザーデータのみで表示することも可能
    # return {}
  end

end
