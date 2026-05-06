import os
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@scriptops.app")

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP verification email via SendGrid HTTP API."""
    try:
        import urllib.request
        import json

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background-color: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155;">
                    <h1 style="color: #8b5cf6; text-align: center; margin-bottom: 30px;">ScriptOps</h1>
                    <p style="font-size: 16px; line-height: 1.6; text-align: center;">Hello,</p>
                    <p style="font-size: 16px; line-height: 1.6; text-align: center;">Your verification code is:</p>
                    <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f8fafc;">{otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #94a3b8; text-align: center;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            </body>
        </html>
        """

        payload = json.dumps({
            "personalizations": [{"to": [{"email": recipient_email}]}],
            "from": {"email": SENDGRID_FROM_EMAIL, "name": "ScriptOps"},
            "subject": "Your ScriptOps Verification Code",
            "content": [{"type": "text/html", "value": html_content}]
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=payload,
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req) as response:
            # SendGrid returns 202 Accepted on success
            if response.status == 202:
                print(f"[MAIL] OTP sent to {recipient_email}")
                return True
            else:
                print(f"[MAIL] Unexpected status: {response.status}")
                return False

    except Exception as e:
        print(f"[MAIL] Error sending email: {e}")
        return False
