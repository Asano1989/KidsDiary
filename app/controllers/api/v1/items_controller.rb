module Api
  module V1
    class ItemsController < ApplicationController
      # このアクションを実行する前に、authenticate_user! を実行しJWTを検証する
      before_action :authenticate_user!
      
      # GET /api/v1/items
      def index
        # JWTから取得したユーザーID（subクレーム）をログに出力
        user_id = @current_user_payload['sub']
        
        Rails.logger.info "Authenticated User ID: #{user_id}"

        # 認証済みユーザーにのみ表示されるダミーデータを返す
        render json: {
          message: "Successfully fetched authenticated data.",
          user_id: user_id,
          items: [
            { id: 1, name: "Secret Item A" }
          ]
        }, status: :ok
      end
    end
  end
end