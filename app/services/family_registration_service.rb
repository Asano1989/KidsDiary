class FamilyRegistrationService
  def initialize(user, family_params)
    @user = user
    @family_params = family_params
  end

  def execute
    # トランザクション開始：どれか一つでも失敗すれば全てロールバック（無効化）
    ActiveRecord::Base.transaction do
      # 1. Familyを作成（このとき owner_id をセット）
      # 破壊的メソッドで、失敗時に例外を発生させてトランザクションを中断させる
      family = Family.create!(@family_params.merge(owner_id: @user.id))

      # 2. 作成したユーザーの family_id を更新
      @user.update!(family_id: family.id)

      family
    end
  rescue ActiveRecord::RecordInvalid => e
    # バリデーションエラーなどが発生した場合の処理
    # ここで false を返すか、エラーメッセージを保持するよう設計
    puts "家族登録エラー: #{e.message}"
    false
  end
end