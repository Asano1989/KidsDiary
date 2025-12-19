class Family < ApplicationRecord
  belongs_to :owner, class_name: 'User', foreign_key: 'owner_id'
  has_many :users
  has_many :children, dependent: :destroy

  validates :name,    length: { in: 1..50 }
end
