class ApplicationController < ActionController::Base
  # Rails APIとして使用する場合、CSRF保護をスキップ
  skip_before_action :verify_authenticity_token
  
  attr_reader :current_user_payload
  
  # ヘルパーメソッドとして定義し、Viewからも使えるようにする
  # helper_method :current_user, :user_logged_in?

  # JWTを検証し、認証済みユーザーのペイロードを設定する (View/ERB向け)
  def require_login
    token = extract_jwt_from_cookies
    
    # トークンがなければ、認証画面へリダイレクト
    unless token
      flash[:alert] = 'ログインが必要です。'
      redirect_to auth_path
      return false
    end
    
    # SupabaseAuthService を使ってトークンを検証
    @current_user_payload = SupabaseAuthService.verify_token(token)

    # 認証失敗（無効、期限切れなど）
    unless @current_user_payload
      flash[:alert] = 'セッションの期限が切れました。再度ログインしてください。'
      redirect_to auth_path
      return false
    end
    
    set_current_user
  end

  private

  # API向け: AuthorizationヘッダーからJWTを取得
  def extract_jwt_from_request
    auth_header = request.headers['Authorization']
    
    if auth_header && auth_header.starts_with?('Bearer ')
      token = auth_header.split(' ').last
      return token
    end

    nil
  end

  require 'json'
  require 'cgi'

  def extract_jwt_from_cookies
    # クライアント側で設定した新しいキー名に統一
    auth_cookie_key = 'rails_access_token'
    
    # 生のJWTが格納されていると想定して読み込む
    auth_cookie_value = cookies[auth_cookie_key]

    # 生のJWT文字列をそのまま返す
    return auth_cookie_value if auth_cookie_value.present?

    # 従来のSupabase暗号化Cookieの読み取りは不要になりました
    nil 
  end
  
  # JWTを検証し、認証済みユーザーのペイロードを設定する (API向け)
  def authenticate_user!
    token = extract_jwt_from_request
    
    # SupabaseAuthService を使ってトークンを検証
    @current_user_payload = SupabaseAuthService.verify_token(token)

    # ペイロードが取得できなければ認証失敗（401 Unauthorized）
    unless @current_user_payload
      render json: { error: 'Unauthorized: Invalid or missing JWT token.' }, status: :unauthorized
      false
    end
  end
  
  # set_current_user メソッド
  def set_current_user
    # Supabase UIDからRailsのUserモデルのインスタンスを取得し、@current_user に設定
    supabase_uid = @current_user_payload['sub']
    @current_user = User.find_by(supabase_uid: supabase_uid)
  end
  
  # current_user メソッド
  def current_user
    @current_user
  end
end
