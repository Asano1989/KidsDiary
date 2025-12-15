class Family < ApplicationRecord
  validates :name,    length: { in: 1..50 }
end
