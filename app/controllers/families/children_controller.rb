module Families
  class ChildrenController < ApplicationController
    before_action :set_family
    before_action :authorize_owner

    def new
      @child = @family.children.build
    end

    def create
      @child = @family.children.build(child_params)
      if @child.save
        redirect_to @family, notice: "子どもの情報を登録しました"
      else
        render :new, status: :unprocessable_entity
      end
    end

    private

    def set_family
      @family = Family.find(params[:family_id])
    end

    def authorize_owner
      unless @family.owner_id == current_user.id
        redirect_to root_path, alert: "権限がありません"
      end
    end

    def child_params
      params.require(:child).permit(:name, :birthday)
    end
  end
end