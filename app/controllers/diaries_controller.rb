class DiariesController < ApplicationController
  before_action :require_login
  before_action :check_family, only: [:new, :create]
  
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

  def check_family
  if current_user.family_id.blank?
    # 家族に所属していない場合はトップページにリダイレクト
    redirect_to root_path, alert: '家族への登録が必要です。'
  end
end
end