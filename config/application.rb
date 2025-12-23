require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module App
  class Application < Rails::Application
    config.load_defaults 7.1

    config.time_zone = "Asia/Tokyo"
    config.active_record.default_timezone = :local
    config.i18n.default_locale = :ja
    
    config.beginning_of_week = :sunday
  end
end
