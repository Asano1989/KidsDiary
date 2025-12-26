class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :diary
  belongs_to :emoji
end
