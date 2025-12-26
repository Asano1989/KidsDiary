class DiariesController < ApplicationController
  before_action :require_login
  before_action :set_diary, only: [:edit, :update, :destroy]
  before_action :check_family, only: [:index, :show, :new, :create, :edit, :update, :destroy]
  
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
    process_child_ids
    @diary.user_id = current_user.id
    if @diary.save
      redirect_to diaries_path, notice: '日記を投稿しました。', status: :see_other
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
    @emoji = @diary.emoji
  end

  def update
    process_child_ids
    if @diary.update(diary_params)
      redirect_to diary_path(@diary.id), notice: '日記を更新しました。', status: :see_other
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

  def date_index
    @date = params[:date]
    # 指定された日付に一致する日記を取得
    @diaries =current_user.family.diaries.where(date: @date).order(created_at: :asc)
  end

  def filter
    # 1. ベースのクエリ（N+1対策含む）
    @diaries = current_user.family.diaries.includes(:children, :emoji).order(date: :desc)

    # パラメータの整理
    @target_child_ids = Array.wrap(params[:child_ids]).reject(&:blank?)
    @target_emoji_id = params[:emoji_id].presence

    # 2. 子供での絞り込み (AND検索ロジック)
    if @target_child_ids.present?
      target_diary_ids = DiaryChild.where(child_id: @target_child_ids)
                                  .group(:diary_id)
                                  .having('COUNT(diary_id) = ?', @target_child_ids.size)
                                  .pluck(:diary_id)
      # 絞り込まれたIDで日記をフィルタリング
      @diaries = @diaries.where(id: target_diary_ids)
      @selected_children = current_user.family.children.where(id: @target_child_ids)
    end

    # 3. 絵文字での絞り込み (if を独立させて子供の絞り込み結果に対してさらに絞り込む)
    if @target_emoji_id.present?
      @diaries = @diaries.where(emoji_id: @target_emoji_id)
      @selected_emoji = Emoji.find_by(id: @target_emoji_id)
    end

    # 4. 何も選択されていない時に日記を表示しない
    if @target_child_ids.blank? && @target_emoji_id.blank?
      @diaries = []
    end
  end

  private

  def diary_params
    params.require(:diary).permit(:date, :emoji_id, :body, child_ids: [])
  end

  def process_child_ids
    # 文字列を数値の配列に変換してセットする
    if params[:diary][:child_ids].is_a?(String)
      params[:diary][:child_ids] = params[:diary][:child_ids].split(',')
      @diary.child_ids = params[:diary][:child_ids]
    end
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