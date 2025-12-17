module ApplicationHelper
  def flash_background_color(type)
    case type.to_sym
    when :notice then "bg-green-100 border border-green-400"
    when :alert  then "bg-red-100 border border-red-400"
    when :error  then "bg-yellow-100 border border-yellow-400"
    else "bg-gray-100 border border-gray-400"
    end
  end
end
