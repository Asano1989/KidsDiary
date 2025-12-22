class DiariesController < ApplicationController
  before_action :require_login
  before_action :check_family, only: [:new, :create]
  
  def new
    @diary = Diary.new
    @children = Child.where(family_id: current_user.family_id)
    @emojis = Emoji.all
  end

  def create
    @diary = Diary.new(diary_params)
    @diary.user_id = current_user.id
    if @diary.save
      redirect_to root_path, notice: '日記を投稿しました！'
    else
      @children = Child.where(family_id: current_user.family_id)
      @emojis = Emoji.all
      flash.now[:alert] = '日記の投稿に失敗しました。'
      render :new, status: :unprocessable_entity
    end
  end

  private

  def diary_params
    params.require(:diary).permit(:date, :emoji_id, :body)
  end

  def check_family
    if current_user.family_id.blank?
      # 家族に所属していない場合はトップページにリダイレクト
      redirect_to root_path, alert: '家族への登録が必要です。'
    end
  end
end