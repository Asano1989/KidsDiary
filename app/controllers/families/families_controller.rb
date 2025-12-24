module Families
  class FamiliesController < ApplicationController
    before_action :require_login
    before_action :set_family, only: [:edit, :update]
    before_action :authorize_owner, only: [:edit, :update]

    def new
      # すでに家族に所属している、またはオーナーである場合は作成画面に行かせない
      unless current_user.can_create_family?
        return redirect_to root_path, alert: "すでに家族に所属しているため、新しく作成することはできません。"
      end

      @family = Family.new
    end

    def create
      service = FamilyRegistrationService.new(current_user, family_params)
      family = service.execute

      if family
        redirect_to family_path(family), notice: '家族を作成しました。', status: :see_other
      else
        flash.now[:alert] = '家族の作成に失敗しました。'
        render :new, status: :unprocessable_entity
      end
    end

    def show
      if current_user.family.present?
        @family = current_user.family
        @members = @family.users
      end
    end

    def edit
      @members = @family.users
    end

    def update
      if @family.update(family_params)
        redirect_to family_path(@family), notice: '家族名を更新しました。', status: :see_other
      else
        # バリデーションエラー時は編集画面を再表示
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def set_family
      @family = Family.find_by(owner_id: current_user.id)
    end

    # オーナー以外は編集できないようにする
    def authorize_owner
      if current_user.family.present?
        unless @family.owner_id == current_user.id
          redirect_to root_path, alert: '編集権限がありません。'
        end
      else
        redirect_to root_path, alert: '家族（グループ）の情報がありません。'
      end
    end

    def family_params
      params.require(:family).permit(:name)
    end
  end
end