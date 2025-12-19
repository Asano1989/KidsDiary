class User < ApplicationRecord
  belongs_to :family, optional: true
  has_one :owned_family, class_name: 'Family', foreign_key: 'owner_id'
  has_one_attached :avatar

  validates :supabase_uid, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
  # 招待時のロジックなどで、既に家族がいる場合はエラーにする
  validate :must_not_belong_to_multiple_families, on: :create_membership

  def can_create_family?
    family_id.nil? && owned_family.nil?
  end

  def display_avatar
    avatar.attached? ? avatar : "default-avatar.png"
  end

  def avatar_url
    if avatar.attached?
      # 外部ストレージのURLを返す
      Rails.application.routes.url_helpers.url_for(avatar)
    else
      # assets内などのデフォルト画像のパスを返す
      ActionController::Base.helpers.asset_path('default-avatar.png')
    end
  end

  private

  def must_not_belong_to_multiple_families
    if family_id.present?
      errors.add(:family, "は既に登録済みです。他の家族に参加することはできません。")
    end
  end
end
