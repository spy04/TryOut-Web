# api/utils.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
import random
from user_agents import parse


# ======= User Agent Formatter =======
def format_user_agent(user_agent_string):
    """
    Ambil string User-Agent, return format: "Browser Version on OS Version"
    """
    ua = parse(user_agent_string)
    browser = f"{ua.browser.family} {ua.browser.version_string}"
    os = f"{ua.os.family} {ua.os.version_string}"
    return f"{browser} on {os}"


# ======= OTP Email =======
def send_otp_email(user_email):
    """
    Kirim OTP ke email user, ada plain text fallback & HTML version
    """
    otp = str(random.randint(100000, 999999))

    # plain text fallback
    text_message = f"""Hai {user_email}! 👋
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
        <p>Hai {user_email}! 👋</p>
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


# ======= Reset Password Email =======
def send_password_reset_email(user, reset_link, ip, user_agent_string):
    """
    Kirim email reset password, ada HTML tombol & plain text fallback
    """
    device_info = format_user_agent(user_agent_string)

    # HTML email
    html_content = render_to_string("reset_password.html", {
        "email": user.email,
        "reset_link": reset_link,
        "ip": ip,
        "device": device_info
    })

    # plain text fallback
    plain_text_content = f"""
Halo {user.email},

Kamu menerima permintaan untuk reset kata sandi akun mu di Pintu Universitas.
Klik tombol di bawah ini untuk membuat kata sandi baru:

{reset_link}

Tautan ini aktif selama 30 menit aja ya.

Request dilakukan dari IP: {ip}
Device / Browser: {device_info}

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
