class CreateReactions < ActiveRecord::Migration[7.1]
  def change
    create_table :reactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :diary, null: false, foreign_key: true
      t.references :emoji, null: false, foreign_key: true

      t.timestamps
    end

    # 同じ人が同じ日記に、同じ絵文字を何度も送れないようにする
    add_index :reactions, [:user_id, :diary_id, :emoji_id], unique: true
  end
end
