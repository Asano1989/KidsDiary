Rails.application.routes.draw do
  root to: 'top#index'

  get 'home' => 'home#index'
end
