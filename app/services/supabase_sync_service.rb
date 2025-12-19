class SupabaseSyncService
  def initialize(user)
    @user = user
    @base_url = ENV['SUPABASE_URL']
    @service_key = ENV['SUPABASE_SERVICE_ROLE_KEY']
  end

  def call
    return false if @base_url.blank? || @service_key.blank?

    # 1. Auth (auth.users) の更新
    update_auth_metadata

    # 2. Profiles (public.profiles) テーブルの更新
    update_public_profile
  rescue => e
    Rails.logger.error "Supabase Sync Error: #{e.message}"
    false
  end

  private

  def client
    @client ||= Faraday.new(url: @base_url) do |conn|
      conn.headers['Authorization'] = "Bearer #{@service_key}"
      conn.headers['apikey'] = @service_key
      conn.headers['Content-Type'] = 'application/json'
      conn.adapter Faraday.default_adapter
    end
  end

  def update_auth_metadata
    # Admin APIを使ってauth.usersのmetadataを更新
    url = "/auth/v1/admin/users/#{@user.supabase_uid}"
    body = { user_metadata: { name: @user.name, birthday: @user.birthday.to_s } }
    client.put(url, body.to_json)
  end

  def update_public_profile
    # PostgREST APIを使ってpublic.profilesを更新
    url = "/rest/v1/profiles?id=eq.#{@user.supabase_uid}"
    body = {
      name: @user.name,
      birthday: @user.birthday.to_s,
      updated_at: Time.current.iso8601
    }
    
    client.patch(url, body.to_json)
  end
end