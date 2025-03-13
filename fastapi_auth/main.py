from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_mail import Mail, Message
import sqlite3
import random
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)

# Configuration
app.secret_key = '1234567890abcdef1234567890abcdef'

# Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'haithamelyounssi@gmail.com'
app.config['MAIL_PASSWORD'] = 'ujnfwuuwzmdbmmgx'

mail = Mail(app)

def get_db_connection():
    conn = sqlite3.connect('instance/users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS users
                   (id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

@app.before_first_request
def before_first_request():
    init_db()

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            session['otp'] = otp
            session['email'] = email
            
            # Send OTP via email
            try:
                msg = Message('Your OTP for Login',
                            sender='haithamelyounssi@gmail.com',
                            recipients=[email])
                msg.body = f'Your OTP is: {otp}'
                mail.send(msg)
                return redirect(url_for('verify_otp'))
            except Exception as e:
                flash('Error sending OTP email. Please try again.', 'error')
                return redirect(url_for('login'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('signup.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Hash the password
        hashed_password = generate_password_hash(password)
        
        conn = get_db_connection()
        try:
            conn.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                        (username, email, hashed_password))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email or username already exists!', 'error')
        finally:
            conn.close()
    
    return render_template('signup.html')

@app.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    if request.method == 'POST':
        user_otp = request.form['otp']
        if 'otp' in session and user_otp == session['otp']:
            # OTP is correct
            session.pop('otp', None)
            session['logged_in'] = True
            session['email'] = session.get('email')
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid OTP. Please try again.', 'error')
    
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return 'Welcome to your dashboard!'

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)