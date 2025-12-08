class User < ApplicationRecord
  validates :supabase_uid, presence: true, uniqueness: true
end
