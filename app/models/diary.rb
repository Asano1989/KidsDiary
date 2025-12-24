class Diary < ApplicationRecord
  belongs_to :user
  belongs_to :emoji

  has_many :diary_children, dependent: :destroy
  has_many :children, through: :diary_children
  
  validates :date, :body, presence: true
end
