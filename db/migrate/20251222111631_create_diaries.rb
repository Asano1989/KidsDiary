class CreateDiaries < ActiveRecord::Migration[7.1]
  def change
    create_table :diaries do |t|
      t.date :date
      t.references :user, null: false, foreign_key: true
      t.text :body
      t.references :emoji, null: false, foreign_key: true

      t.timestamps
    end
  end
end
