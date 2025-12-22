class UserMailer < ApplicationMailer
  def reset_password_email(user)
    @user = user
    @url  = 'http://example.com/login'
    mail(to: @user.email, subject: 'おもいでつむぎ：パスワード再設定のご案内')
  end
end
