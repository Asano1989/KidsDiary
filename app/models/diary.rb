class Diary < ApplicationRecord
  belongs_to :user
  belongs_to :emoji

  has_many :diary_children, dependent: :destroy
  has_many :children, through: :diary_children
  has_many :reactions, dependent: :destroy
  
  validates :date, :body, :children, presence: true

  def self.child_combination_options(family)
    return [] unless family
    
    children = family.children.order(:id)
    options = []

    # 全ての子どもの組み合わせを生成
    (1..children.size).each do |n|
      children.to_a.combination(n).each do |combo|
        label = combo.map(&:name).join("＆")
        value = combo.map(&:id)
        options << [label, value.join(",")]
      end
    end
    options
  end
end
