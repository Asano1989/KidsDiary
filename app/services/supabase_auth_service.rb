require 'jwt'

# SupabaseのJWTトークンを検証し、ペイロード（ユーザー情報）を抽出するサービス
class SupabaseAuthService
  # SupabaseプロジェクトのJWT Secret（シークレットキー）を使用
  JWT_SECRET = Rails.application.credentials.dig(:supabase, :jwt_secret)

  def self.jwt_secret
    Rails.application.credentials.dig(:supabase, :jwt_secret)
  end

  # 実際のSupabaseのデフォルト設定に合わせて、HS256を使用することを仮定
  VERIFY_OPTIONS = {
    verify_expiration: true,
    verify_not_before: true,
    algorithm: 'HS256'
  }.freeze

  # @param token [String] フロントエンドから渡されたJWT
  # @return [Hash, nil] 検証成功時はJWTペイロード（ユーザー情報）、失敗時はnil
  def self.verify_token(token)
    return nil unless token.present?
    
    # 直接メソッド呼び出し結果をシークレットとして使用
    unless self.jwt_secret.present?
      Rails.logger.error "FATAL: SUPABASE_JWT_SECRET is missing from credentials. (Key check failed)"
      return nil
    end

    begin
      # シークレットを直接メソッドから取得
      decoded_token = JWT.decode(token, self.jwt_secret, true, VERIFY_OPTIONS)
      decoded_token.first
      
    rescue JWT::ExpiredSignature => e
      # 期限切れ
      Rails.logger.warn "JWT Expired: #{e.message}"
      nil
    rescue JWT::VerificationError, JWT::ImmatureSignature, JWT::DecodeError => e
      # 署名検証失敗、セグメント数不足、その他のデコードエラー
      Rails.logger.warn "JWT Verification Failed (Decode/Verification Error): #{e.message}"
      nil
    end
  end
end