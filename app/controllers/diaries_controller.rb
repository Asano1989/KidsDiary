class DiariesController < ApplicationController
  before_action :require_login
  before_action :set_diary, only: [:edit, :update, :destroy]
  before_action :check_family, only: [:index, :show, :new, :create, :edit, :udate, :destroy]
  
  def index
    @diaries = current_user.family.diaries.order(date: :desc)
  end

  def show
    @diary = Diary.find(params[:id])
  end

  def new
    @diary = Diary.new
    @children = Child.where(family_id: current_user.family_id)
    @emojis = Emoji.all
  end

  def create
    @diary = Diary.new(diary_params)
    @diary.user_id = current_user.id
    if @diary.save
      redirect_to root_path, notice: '日記を投稿しました。'
    else
      @children = Child.where(family_id: current_user.family_id)
      @emojis = Emoji.all
      flash.now[:alert] = '日記の投稿に失敗しました。'
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @children = Child.where(family_id: current_user.family_id)
    @emojis = Emoji.all
  end

  def update
    if @diary.update(diary_params)
      redirect_to diaries_path, notice: '日記を更新しました。'
    else
      @children = Child.where(family_id: current_user.family_id)
      @emojis = Emoji.all
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @diary.destroy
    redirect_to diaries_path, notice: '日記を削除しました。', status: :see_other
  end

  private

  def diary_params
    params.require(:diary).permit(:date, :emoji_id, :body)
  end

  def set_diary
    # 他人の日記を編集できないよう、current_userから辿る
    @diary = current_user.diaries.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to diaries_path, alert: '指定された日記が見つからないか、編集権限がありません。'
  end

  def check_family
    if current_user.family_id.blank?
      # 家族に所属していない場合はトップページにリダイレクト
      redirect_to root_path, alert: '家族への登録が必要です。'
    end
  end
end