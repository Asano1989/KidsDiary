module Api
  module V1
    class UsersController < ApplicationController
      # JWT検証が成功した場合のみ、このアクションを実行
      # @current_user_payload にJWTペイロード（Supabaseユーザー情報）が格納される
      before_action :authenticate_user! 

      # POST /api/v1/users/register_on_rails
      def register_on_rails
        # JWTペイロードから SupabaseユーザーID (sub) を安全に抽出
        supabase_uid = @current_user_payload['sub']

        # ユーザーIDがない場合はエラー
        unless supabase_uid.present?
          return render json: { error: 'Missing Supabase user ID (sub).' }, status: :unprocessable_entity
        end

        # User.find_or_create_by! を利用して、存在しない場合は作成し、存在するなら取得する
        @user = User.find_or_create_by!(supabase_uid: supabase_uid) do |user|
          # 初回作成時のみ、JWTに含まれるemailなどを設定
          user.email = @current_user_payload['email'] if @current_user_payload['email'].present?
        end

        # 成功レスポンス
        render json: {
          message: 'User successfully linked.',
          user: { id: @user.id, supabase_uid: @user.supabase_uid }
        }, status: :ok
        
      rescue ActiveRecord::RecordInvalid => e
        # バリデーションエラーなど、DB操作上の問題が発生した場合
        render json: { error: "Failed to link user: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end
end