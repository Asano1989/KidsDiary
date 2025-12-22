class Diary < ApplicationRecord
  elongs_to :user
  
  validates :date, :body, presence: true
end
