class RenameUserIdToOwnerIdInFamilies < ActiveRecord::Migration[7.1]
  def change
    rename_column :families, :user_id, :owner_id
    
    remove_index :families, :user_id if index_exists?(:families, :user_id)
    add_index :families, :owner_id, unique: true
  end
end
