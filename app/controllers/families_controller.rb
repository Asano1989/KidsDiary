class FamiliesController < ApplicationController
  before_action :require_login

  def index
  end

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
      redirect_to family_path(family), notice: '家族を作成しました。'
    else
      # 登録画面を再表示
      flash.now[:alert] = '家族の作成に失敗しました。'
      render :new, status: :unprocessable_entity
    end
  end

  def show
    @user = current_user
    @family = Family.find_by(owner_id: @user.id)
  end

  def edit
  end

  private

  def family_params
    params.require(:family).permit(:name)
  end
end