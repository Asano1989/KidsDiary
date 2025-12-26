class ReactionsController < ApplicationController
  def create
    @diary = Diary.find(params[:diary_id])
    
    # 1. 家族チェック（日記の家族IDと、自分の家族IDが一致するか）
    # 2. 自分自身ではないチェック（日記の投稿者と自分が一致しないか）
    if @diary.family_id == current_user.family_id && @diary.user_id != current_user.id
      @reaction = @diary.reactions.new(
        user: current_user,
        emoji_id: params[:emoji_id]
      )
      if @reaction.save
        redirect_back fallback_location: diaries_path, notice: "リアクションしました"
      else
        redirect_back fallback_location: diaries_path, alert: "リアクションに失敗しました"
      end
    else
      redirect_back fallback_location: diaries_path, alert: "自分自身の日記にはリアクションできません"
    end
  end

  def destroy
    @reaction = current_user.reactions.find(params[:id])
    @reaction.destroy
    redirect_back fallback_location: diaries_path, notice: "リアクションを取り消しました"
  end
end