# api/utils.py
from django.core.mail import send_mail
import random

def send_otp_email(user_email):
    otp = str(random.randint(100000, 999999))
    send_mail(
        subject="[TryoutSNBT] Jangan Bagikan OTP Ini ke Siapa Pun!",
        message = f"""Halo, Pejuang SNBT

Terima kasih sudah menggunakan TryoutSNBT 🎓.
Berikut kode OTP (One-Time Password) kamu:

🔑 {otp}

Kode ini berlaku selama 5 menit dan hanya bisa digunakan sekali.
⚠️ Demi keamanan, jangan pernah membagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari TryoutSNBT.

Salam hangat,
Tim TryoutSNBT""",
        from_email="otp.tryoutsnbt@gmail.com",
        recipient_list=[user_email],
        fail_silently=False,
    )
    return otp


from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

def send_password_reset_email(user, reset_link):
    subject = "Reset Password Akunmu"
    from_email = "noreply@yourapp.com"
    to = [user.email]

    html_content = render_to_string("reset_password.html", {
        "reset_link": reset_link,
        "user": user,
    })

    text_content = f"Klik link berikut untuk reset password: {reset_link}"

    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()
