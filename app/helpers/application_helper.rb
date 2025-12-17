module ApplicationHelper
  def flash_background_color(type)
    case type.to_sym
    when :notice then "bg-green-100 border border-green-400  text-green-700"
    when :alert  then "bg-red-100 border border-red-400 text-red-700"
    when :error  then "bg-yellow-100 border border-yellow-400 text-yellow-700"
    else "bg-gray-100 border border-gray-400 text-gray-700"
    end
  end
end
