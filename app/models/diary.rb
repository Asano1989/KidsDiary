class Diary < ApplicationRecord
  belongs_to :user
  belongs_to :emoji
  
  validates :date, :body, presence: true
end
