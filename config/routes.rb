Rails.application.routes.draw do
  namespace :api, defaults: {format: :json}  do
    resources :users, only: [:create] do 
      post '/users/:user_id/listings', to: 'users#index'
    end
    post '/users/search', to: 'users#user_exists'
    resource :session, only: [:create, :new, :destroy]
    resources :listings, only: [:create, :destroy, :show, :update, :index]
  end
  root to: 'static_pages#root'
end
