Rails.application.routes.draw do
  root to: 'top#index'

  get 'home' => 'home#index'

  namespace :api do
    namespace :v1 do
      post 'users/sync', to: 'users#sync'
    end
  end
end
