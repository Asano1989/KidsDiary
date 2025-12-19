class MypagesController < ApplicationController
  before_action :require_login
    
  def show
    # require_loginが成功していれば、@current_userが利用可能
    @user = current_user
    
    # Supabaseからプロフィールデータを取得するロジックを呼び出す
    @profile_data = fetch_supabase_profile_data(@user.supabase_uid)
    
    # app/views/my_pages/show.html.erb がレンダリングされる
  end

  def edit
    @user = current_user
  end

  def update
    @user = current_user
    
    # Rails側のDBを更新
    if @user.update(user_params)
      # Supabase側のデータを更新
      sync_to_supabase(@user)
      
      redirect_to mypage_path, notice: "プロフィールを更新しました。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :birthday, :avatar)
  end

  def sync_to_supabase(user)
    SupabaseSyncService.new(user).call
  end

  # Supabaseからプロフィールを取得する（仮メソッド）
  def fetch_supabase_profile_data(supabase_uid)
    # 実際にはここで、SupabaseのServer API Keyを使って、
    # profilesテーブルから name や avatar_url などをフェッチする処理が入る
    
    # 例: データをフェッチするまで、メールアドレスとUIDを仮データとして返す
    {
      name: @user.email.split('@').first,
      email: @user.email,
      supabase_uid: supabase_uid
    }
  end

end
