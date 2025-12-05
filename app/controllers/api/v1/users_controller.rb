class Api::V1::UsersController < ApplicationController
  # 認証済み（JWTが有効）であることを保証
  before_action :authenticate_user_from_token
  
  # POST /api/v1/users/sync
  def sync
    # ユーザーが独自DBにまだ存在しない場合のみ作成
    unless user_signed_in?
      # JWT検証成功時に設定された @current_supabase_uid を使用
      user = User.new(supabase_uid: @current_supabase_uid)
      
      if user.save
        # 成功: 独自DBにユーザーレコードを作成
        render json: { message: 'User synchronized successfully' }, status: :created
      else
        # 失敗: バリデーションエラーなど
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    else
      # ユーザーは既に存在している場合（2回目以降のアクセス）
      render json: { message: 'User already synchronized' }, status: :ok
    end
  end
end