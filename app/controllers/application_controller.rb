class ApplicationController < ActionController::Base
  # Rails APIとして使用する場合、CSRF保護をスキップ
  skip_before_action :verify_authenticity_token
  
  # 認証済みユーザーのペイロードを格納するアクセサ
  attr_reader :current_user_payload
  
  # 認証が必要なAPIの前に実行
  # before_action :authenticate_user! # このコメントアウトを外すと全コントローラに適用

  private

  def extract_jwt_from_request
    auth_header = request.headers['Authorization']
    
    if auth_header && auth_header.starts_with?('Bearer ')
      token = auth_header.split(' ').last
      return token
    end

    nil
  end

  # JWTを検証し、認証済みユーザーのペイロードを設定する
  def authenticate_user!
    token = extract_jwt_from_request
    
    # SupabaseAuthService を使ってトークンを検証
    @current_user_payload = SupabaseAuthService.verify_token(token)

    # ペイロードが取得できなければ認証失敗（401 Unauthorized）
    unless @current_user_payload
      render json: { error: 'Unauthorized: Invalid or missing JWT token.' }, status: :unauthorized
      # 処理を停止し、コントローラのアクションが実行されないようにする
      false
    end
  end
end
