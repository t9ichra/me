from fastapi import FastAPI, Request, Form, HTTPException, Cookie, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import pymysql
from passlib.context import CryptContext
import uuid
from pydantic import BaseModel
from typing import Optional

# Create the main FastAPI application
app = FastAPI()

# Configure templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection function
def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",  
        password="kilohira01",  
        database="Lost", 
        cursorclass=pymysql.cursors.DictCursor
    )

# Authentication and session functions
def get_user_from_session(user_session: str = Cookie(None)):
    if not user_session:
        raise HTTPException(status_code=401, detail="User not logged in")
    
    try:
        session_data = json.loads(user_session)
        username = session_data.get("username")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid session data")
        return username
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid session data")

# Optional user authentication that doesn't raise an exception
def get_optional_user(user_session: str = Cookie(None)):
    if not user_session:
        return None
    
    try:
        session_data = json.loads(user_session)
        username = session_data.get("username")
        if not username:
            return None
        return username
    except json.JSONDecodeError:
        return None

# User management functions
def fetch_user_info(username: str):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM user WHERE username = %s", (username,))
            return cursor.fetchone()
    finally:
        connection.close()
def update_user_info(username: str, new_username: str, email: str, password: str = None):
    connection = get_db_connection()
    try:
        # Check for duplicate username if it's changed
        if username != new_username:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM user WHERE username = %s", (new_username,))
                if cursor.fetchone():
                    raise pymysql.err.IntegrityError("Duplicate entry for username")
        
        with connection.cursor() as cursor:
            if password:
                # Update including the password
                hashed_password = pwd_context.hash(password)
                cursor.execute("""
                    UPDATE user 
                    SET username = %s, email = %s, password = %s 
                    WHERE username = %s
                """, (new_username, email, hashed_password, username))
            else:
                # Update without changing the password
                cursor.execute("""
                    UPDATE user 
                    SET username = %s, email = %s 
                    WHERE username = %s
                """, (new_username, email, username))
            
            connection.commit()
    finally:
        connection.close()

def delete_user(username: str):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM user WHERE username = %s", (username,))
            connection.commit()
    finally:
        connection.close()

# Authentication middleware
def require_auth(request: Request):
    user_session = request.cookies.get("user_session")
    if not user_session:
        return RedirectResponse(url="/", status_code=303)
    
    try:
        session_data = json.loads(user_session)
        username = session_data.get("username")
        if not username:
            return RedirectResponse(url="/", status_code=303)
        return None
    except json.JSONDecodeError:
        return RedirectResponse(url="/", status_code=303)

# Model class definitions
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

# Public routes
@app.get("/", response_class=HTMLResponse)
async def landing(request: Request):
    return templates.TemplateResponse("landing.html", {"request": request})

@app.get("/auth", response_class=HTMLResponse)
async def get_form(request: Request, error_message: str = None):
    return templates.TemplateResponse("auth.html", {"request": request, "error_message": error_message})

@app.post("/login")
async def login(request: Request, email: str = Form(...), password: str = Form(...)):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT * FROM user WHERE email = %s", (email,))
        db_user = cursor.fetchone()

        if db_user is None:
            return templates.TemplateResponse(
                "auth.html",
                {"request": request, "error_message": "Your soul is not yet bound to our realm. Check your email or sign up."}
            )

        if db_user['isBanned'] == '1':
            cursor.execute("SELECT ban_time, unban_time, reason FROM ban WHERE id_user = %s", (db_user['id_user'],))
            ban_info = cursor.fetchone()

            if ban_info:
                return templates.TemplateResponse(
                    "auth.html",
                    {
                        "request": request,
                        "error_message": f"You have been banished since {ban_info['ban_time']}. "
                                         f"You shall be free on {ban_info['unban_time']}. "
                                         f"Reason: {ban_info['reason']}"
                    }
                )

        if not pwd_context.verify(password, db_user['password']):
            return templates.TemplateResponse(
                "auth.html",
                {"request": request, "error_message": "Your dark secret is incorrect. The shadows reject your entry."}
            )

        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "username": db_user['username']
        }

        session_json = json.dumps(session_data)

        response = RedirectResponse(url="/lobby", status_code=303)
        response.set_cookie(key="user_session", value=session_json, httponly=True)

        return response

    except Exception as e:
        print(f"Login error: {str(e)}")
        return templates.TemplateResponse(
            "auth.html",
            {"request": request, "error_message": "A dark force prevents your entry. Try again later."}
        )
    finally:
        cursor.close()
        connection.close()


@app.post("/signup")
async def signup(
    request: Request, 
    name: str = Form(...), 
    emailSignup: str = Form(...), 
    signupPassword: str = Form(...)
):
    username = name
    email = emailSignup
    password = signupPassword
    
    hashed_password = pwd_context.hash(password)
    user_id = str(uuid.uuid4())[:10]

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT * FROM user WHERE email = %s", (email,))
        if cursor.fetchone():
            return templates.TemplateResponse(
                "auth.html", 
                {"request": request, "error_message": "This infernal email has already been sacrificed. Try another."}
            )
        
        cursor.execute("SELECT * FROM user WHERE username = %s", (username,))
        if cursor.fetchone():
            return templates.TemplateResponse(
                "auth.html", 
                {"request": request, "error_message": "This cursed name has already been claimed by another soul."}
            )
            
        sql = "INSERT INTO user (id_user, username, email, password) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (user_id, username, email, hashed_password))
        connection.commit()

        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "username": username
        }
        
        session_json = json.dumps(session_data)
        
        response = RedirectResponse(url="/lobby", status_code=303)
        response.set_cookie(key="user_session", value=session_json, httponly=True)
        return response

    except pymysql.MySQLError as e:
        connection.rollback()
        print(f"Database error: {str(e)}")
        return templates.TemplateResponse(
            "auth.html", 
            {"request": request, "error_message": "The dark ritual failed. Your sacrifice was rejected."}
        )
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return templates.TemplateResponse(
            "auth.html", 
            {"request": request, "error_message": "A demonic interference occurred. Try the ritual again."}
        )
    finally:
        cursor.close()
        connection.close()

# Protected routes that require authentication
@app.get("/lobby", response_class=HTMLResponse)
async def lobby(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    return templates.TemplateResponse("looby.html", {"request": request})

@app.get("/lore", response_class=HTMLResponse)
async def lore(request: Request):
    username = get_optional_user(request.cookies.get("user_session"))
    return templates.TemplateResponse("lore.html", {"request": request, "username": username})

@app.get("/game", response_class=HTMLResponse)
async def game(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    return templates.TemplateResponse("main.html", {"request": request})

@app.get("/manage_account", response_class=HTMLResponse)
async def manage_account(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    return templates.TemplateResponse("manage.html", {"request": request})

@app.get("/home")
def home(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    username = session_data.get("username", "Unknown Soul")
    return {"message": f"Welcome to the darkness, {username}!"}

@app.get("/manage", response_class=HTMLResponse)
async def get_manage_page(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    username = session_data.get("username")
    
    user_info = fetch_user_info(username)
    success_message = request.cookies.get("success_message")
    
    context = {"request": request, "user_info": user_info}
    
    if success_message:
        try:
            message_data = json.loads(success_message)
            context["success"] = message_data.get("success")
        except json.JSONDecodeError:
            pass
    
    if user_info:
        return templates.TemplateResponse("manage.html", context)
    else:
        return RedirectResponse(url="/", status_code=303)
@app.post("/update_account")
async def update_account(
    request: Request, 
    username: str = Form(...),
    email: str = Form(...), 
    password: str = Form(""), 
    confirmPassword: str = Form("")
):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    current_username = session_data.get("username")
    
    user_info = fetch_user_info(current_username)

    # Handle password update only if both fields are filled
    if password and confirmPassword:
        if password != confirmPassword:
            return templates.TemplateResponse(
                "manage.html", 
                {
                    "request": request, 
                    "user_info": user_info, 
                    "error": "The passwords do not match. Please try again."
                }
            )
    else:
        password = None  # Don't update password if left empty
    
    try:
        update_user_info(current_username, username, email, password)
        
        response = RedirectResponse(url="/manage", status_code=303)
        
        # Update session if username changes
        session_data["username"] = username
        session_json = json.dumps(session_data)
        response.set_cookie(key="user_session", value=session_json)
        
        success_message = "Your account has been successfully updated!"
        success_data = json.dumps({"success": success_message})
        response.set_cookie(key="success_message", value=success_data, max_age=30)
        
        return response
    
    except Exception as e:
        error_msg = "An error occurred. Please try again."
        if isinstance(e, pymysql.err.IntegrityError):
            error_str = str(e)
            if "Duplicate entry" in error_str:
                if "email" in error_str:
                    error_msg = "This email is already in use. Please try another."
                else:
                    error_msg = "This username is already taken. Please choose another."
        
        return templates.TemplateResponse(
            "manage.html", 
            {
                "request": request, 
                "user_info": user_info, 
                "error": error_msg
            }
        )

@app.post("/delete_account")
async def delete_account(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    username = session_data.get("username")
    
    try:
        delete_user(username)
        response = RedirectResponse(url="/", status_code=303)
        response.delete_cookie(key="user_session")
        return response
    except Exception as e:
        return templates.TemplateResponse(
            "manage.html", 
            {"request": request, "user_info": fetch_user_info(username), "error": str(e)}
        )

@app.get("/disconnect")
async def disconnect():
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie(key="user_session")
    return response

# Main entry point to run the application
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)