class DiariesController < ApplicationController
  before_action :require_login
  
  def new
    @user = current_user
    @diary = Diary.new

    @children = Child.where(family_id: @user.family_id)
    @emojis = Emoji.all
  end

  def create
    @user = current_user
    @diary = Diary.new(diary_params)
    @diary.user_id = @user.id
    if @diary.save
      redirect_to root_path
    else
      flash.now[:alert] = '日記の投稿に失敗しました。'
      render `diaries/new`
    end
  end

  private

  def diary_params
    params.require(:diary).permit(:date, :@user_id, :emoji_id, :body)
  end
end