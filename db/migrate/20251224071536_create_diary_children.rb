class CreateDiaryChildren < ActiveRecord::Migration[7.1]
  def change
    create_table :diary_children do |t|
      t.references :diary, null: false, foreign_key: true
      t.references :child, null: false, foreign_key: true

      t.timestamps
    end
  end
end
