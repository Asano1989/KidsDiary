class AddFamilyIdToUsers < ActiveRecord::Migration[7.1]
  def change
    add_reference :users, :family, foreign_key: true, index: true
  end
end
