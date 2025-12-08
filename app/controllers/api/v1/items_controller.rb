module Api
  module V1
    class ItemsController < ApplicationController
      # このアクションを実行する前に、authenticate_user! を実行しJWTを検証する
      before_action :authenticate_user!
      
      # GET /api/v1/items
      def index
        # 認証済みであることのみを伝える最小限のレスポンスに変更
        render json: {
          authenticated: true, # 認証に成功したことだけを示す
          # user_id: @current_user_payload['sub'] # IDは必要なければ削除
        }, status: :ok
      end
    end
  end
end