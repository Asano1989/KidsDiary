class ApplicationController < ActionController::Base
  # Rails APIとして使用する場合、CSRF保護をスキップ
  skip_before_action :verify_authenticity_token
  
  attr_reader :current_user_payload
  
  # ヘルパーメソッドとして定義し、Viewからも使えるようにする
  helper_method :current_user, :user_logged_in?

  before_action :ensure_user_loaded

  def ensure_user_loaded
    current_user
  end

  def require_login
    # current_userを呼び出すだけで、認証プロセスが実行される
    unless current_user
      flash[:alert] = 'ログインが必要です。'
      # ログアウト処理後にリダイレクト先が正しいか確認 (root_pathなど)
      redirect_to auth_path
      return false
    end
  end

  def current_user
    # 既に取得済みであればそれを返す（メモ化）
    return @current_user if defined?(@current_user)

    token = extract_jwt_from_cookies

    # 1. トークンがなければ、未ログイン
    unless token
      @current_user = nil
      return @current_user
    end

    # 2. SupabaseAuthService を使ってトークンを検証
    payload = SupabaseAuthService.verify_token(token)

    # 3. 認証失敗（無効、期限切れなど）
    unless payload
      @current_user = nil
      # 無効なトークンのCookieはここで削除する
      cookies.delete(:rails_access_token, domain: :all)
      return @current_user
    end

    # 4. 認証成功: Userモデルを取得しメモ化
    @current_user_payload = payload # 必要であればペイロードも設定
    supabase_uid = payload['sub']
    @current_user = User.find_by(supabase_uid: supabase_uid)

    # ユーザーが見つからなければ、これも未ログインとして扱う
    @current_user = nil unless @current_user
    
    @current_user
  end

  def logged_in?
    current_user.present?
  end
  
  helper_method :logged_in?

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
end
