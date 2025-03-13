from flask import Flask, render_template, request, redirect, url_for, session
from flask_mail import Mail, Message
import random
import os
from datetime import datetime

app = Flask(__name__, template_folder='.')  # Change this line to use current directory

app.secret_key = '1234567890abcdef1234567890abcdef'  


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'haithamelyounssi@gmail.com'  
app.config['MAIL_PASSWORD'] = 'ujnfwuuwzmdbmmgx'

mail = Mail(app)

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        session['otp'] = otp
        session['email'] = email
        
        # Send OTP via email
        msg = Message('Your OTP for Login',
                     sender='haithamelyounssi@gmail.com',
                     recipients=[email])
        msg.body = f'Your OTP is: {otp}'
        mail.send(msg)
        
        return redirect(url_for('verify_otp'))
    
    return render_template('login.html')

@app.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    if request.method == 'POST':
        user_otp = request.form['otp']
        if 'otp' in session and user_otp == session['otp']:
            # OTP is correct
            session.pop('otp', None)
            return 'Login successful!'  # You can redirect to a dashboard or home page
        else:
            return 'Invalid OTP. Please try again.'
    
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)