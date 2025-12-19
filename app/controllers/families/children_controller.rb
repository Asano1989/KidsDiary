module Families
  class ChildrenController < ApplicationController
    before_action :set_family
    before_action :authorize_owner
    before_action :set_child, only: [:edit, :update, :destroy]

    def index
      @children = @family.children
    end

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

    def edit
    end

    def update
      if @child.update(child_params)
        redirect_to family_path(@family), notice: "子どもの情報を更新しました"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @child.destroy
      redirect_to family_path(@family), notice: "子どもの情報を削除しました"
    end

    private

    def set_family
      @family = Family.find(params[:family_id])
    end

    def set_child
      @child = @family.children.find(params[:id])
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