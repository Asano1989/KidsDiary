class ApplicationController < ActionController::Base
  SUPPORT_BROWSER_VERSIONS = {safari: 16.4, firefox: 121, chrome: all, edge: all, opera: all, ie: false}
  allow_browser versions: SUPPORT_BROWSER_VERSIONS
end
