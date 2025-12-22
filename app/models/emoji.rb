class Emoji < ApplicationRecord
  has_many :diaries
  validates :character, presence: true
end
