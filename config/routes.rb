Rails.application.routes.draw do
  root 'top#index'

  get 'auth', to: 'auth#index'
  get 'mypage', to: 'my_pages#show'
    
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
