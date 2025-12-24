class Child < ApplicationRecord
  belongs_to :family

  has_many :diary_children, dependent: :destroy
  has_many :diaries, through: :diary_children

  validates :name, presence: true
  validates :birthday, presence: true
end
