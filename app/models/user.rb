class User < ApplicationRecord
  validates :supabase_uid, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
end
