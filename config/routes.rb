Rails.application.routes.draw do
  root 'top#index'

  get 'auth', to: 'auth#index'
  delete 'logout', to: 'auth#destroy', as: :logout
  post 'auth/set_cookie', to: 'auth#set_cookie'
  get 'auth/current_header', to: 'auth#current_header'
  
  get 'mypage', to: 'my_pages#show'

  resource :family, as: :family do
    get 'confirm'
  end
    
  # APIエンドポイントの定義
  namespace :api do
    namespace :v1 do
      resource :user, only: [], path: 'users' do
        post :register_on_rails, on: :collection
      end

      resources :items, only: [:index]
    end
  end
end
