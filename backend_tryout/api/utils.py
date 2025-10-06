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


from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_password_reset_email(user, reset_link, ip, device):
    html_content = render_to_string("reset_email.html", {
        "email": user.email,
        "reset_link": reset_link,
        "ip": ip,
        "device": device
    })
    send_mail(
        subject="Reset Password Akunmu",
        message="",
        from_email="no-reply@domain.com",
        recipient_list=[user.email],
        html_message=html_content
    )
