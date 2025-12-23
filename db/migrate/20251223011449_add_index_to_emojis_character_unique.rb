class AddIndexToEmojisCharacterUnique < ActiveRecord::Migration[7.1]
  def change
    add_index :emojis, :character, unique: true
  end
end
