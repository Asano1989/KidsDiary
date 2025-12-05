class AddSupabaseUidToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :supabase_uid, :string
      
    # IDが一意であることを保証し、検索の効率化のためインデックスとユニーク制約を追加
    add_index :users, :supabase_uid, unique: true
  end
end
