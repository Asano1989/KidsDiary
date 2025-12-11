module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      # POST /api/v1/users/register_on_rails
      def register_on_rails
        supabase_uid = @current_user_payload['sub']
        
        unless supabase_uid.present?
          return render json: { error: 'Missing Supabase user ID (sub).' }, status: :unprocessable_entity
        end

        permitted_params = user_params

        # find_or_create_by! を利用
        @user = User.find_or_create_by!(supabase_uid: supabase_uid) do |user|
          user.email = @current_user_payload['email']
          
          # 新規作成時にパラメータがあれば設定 (なくてもNULLで保存される)
          user.name = permitted_params[:name] if permitted_params[:name].present?
          user.birthday = permitted_params[:birthday] if permitted_params[:birthday].present?
        end
        
        # 既にユーザーが存在する場合 (または新規作成直後) の更新処理を安全にする
        # 既にDBにnilで保存されているユーザーに対して、パラメータがあれば更新する
        # updateメソッドは、nilのキーを無視してくれる
        
        update_attrs = {}
        update_attrs[:name] = permitted_params[:name] if permitted_params[:name].present? && @user.name.nil?
        update_attrs[:birthday] = permitted_params[:birthday] if permitted_params[:birthday].present? && @user.birthday.nil?

        if update_attrs.present?
          # update! は失敗時に例外を発生させるため、update を使用
          @user.update(update_attrs)
        end

        # 成功レスポンス
        render json: { user: @user.as_json(only: [:name, :birthday]) }, status: :ok
        
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: "Failed to link user: #{e.message}" }, status: :unprocessable_entity
      end

      private

      def user_params
        # params[:user] が存在しない場合に備えて例外処理
        params.require(:user).permit(:name, :birthday)
      rescue ActionController::ParameterMissing
        # userキーが存在しない場合は空のHashを返すことで、エラーを回避する
        {}
      end
    end
  end
end