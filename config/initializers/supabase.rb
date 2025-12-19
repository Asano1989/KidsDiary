SUPABASE_CLIENT = Supabase::Client.new do |config|
  config.url = ENV['SUPABASE_URL']
  config.key = ENV['SUPABASE_SERVICE_ROLE_KEY']
end