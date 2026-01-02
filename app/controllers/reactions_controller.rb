class ReactionsController < ApplicationController
  def create
    @diary = Diary.find(params[:diary_id])
    
    # 1. 家族チェック（日記の家族IDと、自分の家族IDが一致するか）
    # 2. 自分自身ではないチェック（日記の投稿者と自分が一致しないか）
    if @diary.user.family_id == current_user.family_id && @diary.user_id != current_user.id
      @reaction = @diary.reactions.new(
        user: current_user,
        emoji_id: params[:emoji_id]
      )
      if @reaction.save
        flash.now[:notice] = "リアクションを付けしました"
        render_reaction_stream
      else
        flash.now[:notice] = "リアクション失敗しました"
        render_reaction_stream
      end
    else
      flash.now[:alert] = "自分自身の日記にはリアクションできません"
      render_reaction_stream
    end
  end

  def destroy
    @reaction = current_user.reactions.find(params[:id])
    @diary = @reaction.diary
    @reaction.destroy

    flash.now[:notice] = "リアクションを取り消しました"
    render_reaction_stream
  end

  private

  def render_reaction_stream
    render turbo_stream: [
      # 1. リアクションエリアを更新
      turbo_stream.replace(
        "diary_#{@diary.id}_reaction_area",
        render_to_string(partial: 'diaries/reaction', locals: { diary: @diary })
      ),
      # 2. フラッシュメッセージエリアを更新
      turbo_stream.update(
        "flash_messages",
        render_to_string(partial: 'shared/flash_messages')
      )
    ]
  end
end