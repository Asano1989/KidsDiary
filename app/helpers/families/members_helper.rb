module Families::MembersHelper
  def delete_or_optout(user, family)
    if user.id == family.owner_id
      "削除する"
    else
      "脱退する"
    end
  end
end
