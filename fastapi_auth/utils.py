import random
import string
import bcrypt
from pydantic import EmailStr
from aiosmtplib import sendmail
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException

# Utility function to generate OTP
def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

# Hash password function
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Verify password function
def verify_password(hashed_password: str, password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# Utility function to send OTP via email
async def send_otp_email(recipient_email: EmailStr, otp: str) -> None:
    message = MIMEMultipart()
    message["From"] = "your_email@gmail.com"
    message["To"] = recipient_email
    message["Subject"] = "Your OTP for Verification"
    
    body = f"Your OTP is: {otp}"
    message.attach(MIMEText(body, "plain"))

    try:
        await sendmail("your_email@gmail.com", recipient_email, message.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
