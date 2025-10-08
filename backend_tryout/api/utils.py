# api/utils.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
import random

def send_otp_email(user_email, user_name):
    otp = str(random.randint(100000, 999999))

    # plain text fallback
    text_message = f"""Hai {user_name}! 👋
Kami hanya perlu memastikan kalau ini benar-benar kamu.
Masukkan kode berikut untuk melanjutkan:

{otp}

Kode ini akan kadaluarsa dalam 5 menit, jadi gunakan segera ya!

Belajar seru dimulai dari sini,
Tim Pintu Universitas
"""

    # HTML version
    html_message = f"""
    <html>
      <body>
        <p>Hai {user_name}! 👋</p>
        <p>Kami hanya perlu memastikan kalau ini benar-benar kamu.</p>
        <p>Masukkan kode berikut untuk melanjutkan:</p>
        <h2 style="color:#152D64;">{otp}</h2>
        <p>Kode ini akan kadaluarsa dalam <strong>5 menit</strong>, jadi gunakan segera ya!</p>
        <p>Belajar seru dimulai dari sini,<br><strong>Tim Pintu Universitas</strong></p>
      </body>
    </html>
    """

    send_mail(
        subject="Yuk, masuk ke Pintu Universitas! Ini kode OTP-mu 🎓",
        message=text_message,
        from_email="no-reply@pintuniv.com",
        recipient_list=[user_email],
        html_message=html_message,
        fail_silently=False,
    )
    return otp



from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_password_reset_email(user, reset_link, ip, device):
    html_content = render_to_string("reset_password.html", {
        "email": user.email,
        "reset_link": reset_link,
        "ip": ip,
        "device": device
    })

    plain_text_content = f"""
Halo {user.email},

Kamu menerima permintaan untuk reset kata sandi akun mu di Pintu Universitas.
Klik tombol di bawah ini untuk membuat kata sandi baru:

{reset_link}

Tautan ini aktif selama 30 menit aja ya.
Kalau kamu nggak merasa minta reset, abaikan aja email ini.

Request dilakukan dari IP: {ip}
Device / Browser: {device}

Kalau kamu tidak meminta reset password, abaikan email ini.


Salam hangat,
Tim Pintu Universitas

"""

    send_mail(
        subject="Yuk, ganti kata sandi di Pintu Universitas 🎓",
        message=plain_text_content,  # plain text fallback
        from_email="no-reply@pintuniv.com",
        recipient_list=[user.email],
        html_message=html_content    # tombol cantik & HTML
    )

