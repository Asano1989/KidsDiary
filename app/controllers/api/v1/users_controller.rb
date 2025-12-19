module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      def user_params
        params.require(:user).permit(:supabase_uid, :email, :name, :birthday, :avatar)
      end

      # POST /api/v1/users/register_on_rails
      def register_on_rails
        # supabase_uid で既存ユーザーを探す、なければ新しく作る
        @user = User.find_or_initialize_by(supabase_uid: user_params[:supabase_uid])
        
        # データを上書きする
        @user.email = user_params[:email] if user_params[:email].present?
        @user.name = user_params[:name] if user_params[:name].present?
        @user.birthday = user_params[:birthday] if user_params[:birthday].present?
        @user.avatar.attach(user_params[:avatar]) if user_params[:avatar].present?

        if @user.save
          render json: { status: 'success', user: @user }, status: :ok # 200 OK
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end

      rescue => e
        logger.error "Registration Error: #{e.message}"
        render json: { error: "Internal Server Error" }, status: :internal_server_error
      end

      
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :bad_request
      rescue => e
        # 予期せぬエラーのキャッチ
        render json: { error: "Internal Server Error: #{e.message}" }, status: :internal_server_error

    end
  end
end