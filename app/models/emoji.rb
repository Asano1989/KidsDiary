class Emoji < ApplicationRecord
  has_many :diaries
  has_many :reactions

  validates :character, presence: true, uniqueness: true
end
