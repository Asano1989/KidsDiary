class User < ApplicationRecord
  belongs_to :family, optional: true
  has_one :owned_family, class_name: 'Family', foreign_key: 'owner_id'

  validates :supabase_uid, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
end
