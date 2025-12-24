module Families
  class MembersController < ApplicationController
    before_action :set_family, only: [:index, :new, :create, :destroy]
    before_action :set_user, only: [:destroy]
    before_action :authorize_delete, only: [:destroy]

    def index
      @members = @family.users
    end

    def new
    end

    def create
      # 1. 入力されたメールアドレスからユーザーを探す
      @user = User.find_by(email: params[:email])

      if @user.nil?
        redirect_to family_path(@family), alert: "指定されたメールアドレスのユーザーが見つかりません。"
      elsif @user.family_id.present?
        redirect_to family_path(@family), alert: "そのユーザーは既に他の家族に所属しています。"
      else
        # 2. ユーザーのfamily_idを更新して所属させる
        if @user.update(family_id: @family.id)
          redirect_to family_path(@family), notice: "#{@user.name} さんをメンバーに追加しました。"
        else
          redirect_to family_path(@family), alert: "メンバーの追加に失敗しました。"
        end
      end
    end

    def destroy
      if @user.update(family_id: nil)
        redirect_path = (@user == current_user) ? root_path : family_members_path(@family)
        redirect_to redirect_path, notice: "#{@user.name} さんを家族から削除（脱退）しました。"
      else
        redirect_to family_members_path(@family), alert: "メンバーの削除（脱退）に失敗しました。"
      end
    end

    private

    def set_family
      @family = Family.find(params[:family_id])
    end

    def set_user
      @user = @family.users.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      redirect_to family_members_path(@family), alert: "ユーザーが見つかりません。"
    end

    def authorize_delete
      # 1. 権限チェック: 自分がオーナーか、あるいは自分自身の脱退か
      unless @family.owner_id == current_user.id || @user.id == current_user.id
        return redirect_to family_members_path(@family), alert: "削除する権限がありません。"
      end

      # 2. オーナー脱退時の制約チェック
      if @user.id == @family.owner_id
        # オーナー以外のメンバーが1人でも存在するか確認
        if @family.users.count > 1
          return redirect_to family_members_path(@family),
                            alert: "他にメンバーがいる状態では、オーナーは脱退できません。"
        end
      end
    end
  end
end
