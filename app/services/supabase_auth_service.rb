require 'net/http'
require 'json'

class SupabaseAuthService
  # 環境変数またはcredentialsから取得したJWKSのURL
  JWKS_URL = Rails.application.credentials.supabase[:jwks_url]

  # 鍵のキャッシュを保持
  @@jwks_keys = nil 

  def self.fetch_jwks
    return @@jwks_keys if @@jwks_keys
    
    uri = URI(JWKS_URL)
    response = Net::HTTP.get(uri)
    data = JSON.parse(response)
    
    @@jwks_keys = data['keys'].map do |key_data|
      # Base64でエンコードされた公開鍵情報をRSAキーオブジェクトに変換
      key_data['alg'] = 'RS256'
      JWT::JWK.new(key_data)
    end
    
    @@jwks_keys
  rescue => e
    Rails.logger.error "Failed to fetch Supabase JWKS: #{e.message}"
    nil
  end
end