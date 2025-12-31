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
        render_reaction_stream
      else
        render_reaction_stream
        # redirect_back fallback_location: diary_path(@diary), alert: "リアクションに失敗しました"
      end
    else
      render turbo_stream: turbo_stream.replace(
        "diary_#{@diary.id}_reaction_area",
        render_to_string(partial: 'diaries/reaction', locals: { diary: @diary })
      )
    end
  end

  def destroy
    @reaction = current_user.reactions.find(params[:id])
    @diary = @reaction.diary
    @reaction.destroy

    render_reaction_stream
  end
end

private

def render_reaction_stream
  render turbo_stream: turbo_stream.replace(
    "diary_#{@diary.id}_reaction_area",
    render_to_string(partial: 'diaries/reaction', locals: { diary: @diary })
  )
end