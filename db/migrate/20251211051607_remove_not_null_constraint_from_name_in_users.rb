class RemoveNotNullConstraintFromNameInUsers < ActiveRecord::Migration[7.1]
  def change
    # nameカラムのNULL制約を解除
    change_column_null :users, :name, true
  end
end
