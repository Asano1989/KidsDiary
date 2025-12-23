class Emoji < ApplicationRecord
  has_many :diaries
  validates :character, presence: true, uniqueness: true
end
