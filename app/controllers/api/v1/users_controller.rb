module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      def user_link_params
        params.require(:user).permit(:supabase_uid, :email, :name, :birthday, :avatar)
      end

      # POST /api/v1/users/register_on_rails
      def register_on_rails
        user_params = user_link_params

        # 1. Supabase UIDで既存ユーザーを検索
        user = User.find_by(supabase_uid: user_params[:supabase_uid])

        if user
          # 1-a. UIDで発見: 紐づけ済み
          # 💡 修正 1: ユーザーが既に存在する場合でも、新しい名前/誕生日で更新
            update_data = {}
            update_data[:name] = user_params[:name] if user_params[:name].present?
            update_data[:birthday] = user_params[:birthday].presence if user_params[:birthday] # .presenceで空文字列をnilに
            update_data[:avatar] = user_params[:avatar].presence if user_params[:avatar]

            if update_data.empty? || user.update(update_data)
                render json: { success: true, message: 'User updated or already linked by UID.' }, status: :ok
            else
                error_message = "Update failed: #{user.errors.full_messages.to_sentence}"
                render json: { error: "Failed to update user: #{error_message}" }, status: :unprocessable_content
            end
        else
          # 2. UIDで見つからなかった場合、Emailでユーザーを検索
          user_by_email = User.find_by(email: user_params[:email])

          if user_by_email
            # 2-a. Emailで発見: 既存ユーザーにsupabase_uidを紐づける
            # 💡 修正: 新規登録時に入力されたname/birthdayがあれば、既存ユーザーを更新
            update_data = { supabase_uid: user_params[:supabase_uid] }
            update_data[:name] = user_params[:name] if user_params[:name].present?
            update_data[:birthday] = user_params[:birthday] if user_params[:birthday].present?
            update_data[:avatar] = user_params[:avatar] if user_params[:avatar].present?

            if user_by_email.update(update_data)
              render json: { success: true, message: 'User linked by Email.' }, status: :ok
            else
              # 更新に失敗した場合
              error_message = "Update failed: #{user_by_email.errors.full_messages.to_sentence}"
              render json: { error: "Failed to link user: #{error_message}" }, status: :unprocessable_content
            end
          else
          
          # 3. UID, Emailどちらでも見つからなかった場合: 新規登録
          
            final_params = {
              supabase_uid: user_params[:supabase_uid],
              email: user_params[:email],
              name: user_params[:name].presence || user_params[:email].split('@').first || "ユーザー",
              birthday: user_params[:birthday].presence, # nilまたは空文字列の場合はnilになる
              avatar: user_params[:avatar].presence
            }

            new_user = User.create(final_params)

            if new_user.persisted?
              render json: { success: true, message: 'New user created.' }, status: :created
            else
              # 新規登録に失敗した場合
              error_message = "Validation failed: #{new_user.errors.full_messages.to_sentence}"
              render json: { error: "Failed to create user: #{error_message}" }, status: :unprocessable_content
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