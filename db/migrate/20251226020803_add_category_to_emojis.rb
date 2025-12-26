class AddCategoryToEmojis < ActiveRecord::Migration[7.1]
  def change
    add_column :emojis, :category, :string
  end
end
