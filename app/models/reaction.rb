class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :diary
  belongs_to :emoji

  # 1人1つの絵文字につき1回まで
  validates :user_id, uniqueness: { scope: [:diary_id, :emoji_id], message: "同じリアクションは既に登録済みです" }

  # 1人1つの日記に絵文字は合計5つまで
  validate :validate_reactions_count_limit, on: :create

  private

  def validate_reactions_count_limit
    # 自分がこの日記に既に付けているリアクションの数をカウント
    existing_count = user.reactions.where(diary_id: diary_id).count
    if existing_count >= 5
      errors.add(:base, "1つの日記に付けられるリアクションは5つまでです")
    end
  end
end
