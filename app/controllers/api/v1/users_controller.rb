module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      def user_link_params
        params.require(:user).permit(:supabase_uid, :email, :name, :birthday)
      end

      # POST /api/v1/users/register_on_rails
      def register_on_rails
        user_params = user_link_params
        
        # 1. Supabase UIDで既存ユーザーを検索
        user = User.find_by(supabase_uid: user_params[:supabase_uid])

        if user
          # 1-a. UIDで発見: 紐づけ済み
          render json: { success: true, message: 'User already linked by UID.' }, status: :ok
        else
          # 2. UIDで見つからなかった場合、Emailでユーザーを検索
          user_by_email = User.find_by(email: user_params[:email])

          if user_by_email
            # 2-a. Emailで発見: 既存ユーザーにsupabase_uidを紐づける
            if user_by_email.update(supabase_uid: user_params[:supabase_uid])
              render json: { success: true, message: 'User linked by Email.' }, status: :ok
            else
              # 更新に失敗した場合
              error_message = "Update failed: #{user_by_email.errors.full_messages.to_sentence}"
              render json: { error: "Failed to link user: #{error_message}" }, status: :unprocessable_content
            end
          else
            # 3. UID, Emailどちらでも見つからなかった場合: 新規登録
            default_name = user_params[:email].split('@').first || "ユーザー"
            final_params = user_params.merge(name: user_params[:name] || default_name)
            
            new_user = User.create(final_params)
            
            if new_user.persisted?
              render json: { success: true, message: 'New user created.' }, status: :created
            else
              # 新規登録に失敗した場合
              error_message = "Validation failed: #{new_user.errors.full_messages.to_sentence}"
              render json: { error: "Failed to link user: #{error_message}" }, status: :unprocessable_content
            end
          end
        end
      end

      
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :bad_request
      rescue => e
        # 予期せぬエラーのキャッチ
        render json: { error: "Internal Server Error: #{e.message}" }, status: :internal_server_error

    end
  end
end