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


app = FastAPI()


templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",  
        password="kilohira01",  
        database="Lost", 
        cursorclass=pymysql.cursors.DictCursor
    )


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
        
        if username != new_username:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM user WHERE username = %s", (new_username,))
                if cursor.fetchone():
                    raise pymysql.err.IntegrityError("Duplicate entry for username")
        
        with connection.cursor() as cursor:
            if password:
                
                hashed_password = pwd_context.hash(password)
                cursor.execute("""
                    UPDATE user 
                    SET username = %s, email = %s, password = %s 
                    WHERE username = %s
                """, (new_username, email, hashed_password, username))
            else:
              
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


def require_auth(request: Request):
    user_session = request.cookies.get("user_session")
    if not user_session:
        error_message = "You are not logged in. The shadows reject your presence."
        return RedirectResponse(url=f"/?error={error_message}", status_code=303)
    
    try:
        session_data = json.loads(user_session)
        username = session_data.get("username")
        if not username:
            error_message = "Your soul has faded. Login again to restore your existence."
            return RedirectResponse(url=f"/?error={error_message}", status_code=303)
        return None
    except json.JSONDecodeError:
        error_message = "Corrupted session. The void has consumed your identity."
        return RedirectResponse(url=f"/?error={error_message}", status_code=303)

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


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
    
    # Check username length
    if len(username) < 5 or len(username) > 20:
        return templates.TemplateResponse(
            "auth.html", 
            {"request": request, "error_message": "Your unholy name must be between 5 and 20 characters in length."}
        )
        
    # Check if username is "server"
    if username.lower() == "server":
        return templates.TemplateResponse(
            "auth.html", 
            {"request": request, "error_message": "The name 'server' is forbidden in this realm. Choose another."}
        )
    
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

@app.get("/lobby", response_class=HTMLResponse)
async def lobby(request: Request):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    username = session_data.get("username", "Unknown")
    
    return templates.TemplateResponse("looby.html", {"request": request, "username": username})

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


    if password and confirmPassword:
        if password != confirmPassword:
            return templates.TemplateResponse(
                "manage.html", 
                {
                    "request": request, 
                    "user_info": user_info, 
                    "error": "The cursed passwords do not align. Try again."
                }
            )
    else:
        password = None  # MATBDLCH L PASSWORD ILA KAN NULL !!!!!!!!!!!!! HOOOOOOOOOOOOOO
    
    try:
        update_user_info(current_username, username, email, password)
        
        response = RedirectResponse(url="/manage", status_code=303)
        
        
        session_data["username"] = username
        session_json = json.dumps(session_data)
        response.set_cookie(key="user_session", value=session_json)
        
        success_message = "Your unholy account has been successfully updated!"
        success_data = json.dumps({"success": success_message})
        response.set_cookie(key="success_message", value=success_data, max_age=30)
        
        return response
    
    except Exception as e:
        error_msg = "A supernatural error occurred. Try again if you dare."
        if isinstance(e, pymysql.err.IntegrityError):
            error_str = str(e)
            if "Duplicate entry" in error_str:
                if "email" in error_str:
                    error_msg = "This infernal email has already been sacrificed. Try another"
                else:
                    error_msg = "This unholy username has already been claimed. Choose another."
        
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


@app.get("/ban/{username}")
async def ban_user(request: Request, username: str):
    redirect_response = require_auth(request)
    if redirect_response:
        return redirect_response
    
    user_session = request.cookies.get("user_session")
    session_data = json.loads(user_session)
    current_username = session_data.get("username")
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id_user FROM user WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail=f"User '{username}' not found")
            
            user_id = user['id_user']
            
            cursor.execute("UPDATE user SET isBanned = '1' WHERE id_user = %s", (user_id,))
            
            from datetime import datetime, timedelta
            ban_time = datetime.now()
            unban_time = ban_time + timedelta(days=3)
            
            ban_time_str = ban_time.strftime("%Y-%m-%d %H:%M:%S")
            unban_time_str = unban_time.strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(
                "INSERT INTO ban (id_user, ban_time, unban_time, reason) VALUES (%s, %s, %s, %s)",
                (
                    user_id, 
                    ban_time_str, 
                    unban_time_str, 
                    "You violated the rules and used offensive language."
                )
            )
            
            connection.commit()
            
            if username == current_username:
                response = RedirectResponse(url="/", status_code=303)
                response.delete_cookie(key="user_session")
                return response
            
            return JSONResponse(
                content={
                    "message": f"User '{username}' has been banished for 3 days",
                    "ban_time": ban_time_str,
                    "unban_time": unban_time_str
                },
                status_code=200
            )
            
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to ban user: {str(e)}")
    finally:
        connection.close()

@app.get("/disconnect")
async def disconnect():
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie(key="user_session")
    return response

from datetime import datetime
from pydantic import BaseModel


class GameHistoryRecord(BaseModel):
    username: str
    gameId: str
    gameType: str

@app.post("/record_history")
async def record_history(history_data: GameHistoryRecord, request: Request):
    # Check authentication
    redirect_response = require_auth(request)
    if redirect_response:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Get user session data to verify username
        user_session = request.cookies.get("user_session")
        session_data = json.loads(user_session)
        session_username = session_data.get("username", "Unknown")
        
        # Verify username matches the session (security check)
        if session_username != history_data.username:
            raise HTTPException(status_code=403, detail="Username mismatch")
        
        # Get user ID from database
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Query user ID from username
        cursor.execute("SELECT id_user FROM user WHERE username = %s", (history_data.username,))
        user_result = cursor.fetchone()
        
        if not user_result:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result['id_user']
        
        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Insert record into history table
        cursor.execute(
            "INSERT INTO history (id_user, joined_at, idLobby, type_Lobby) VALUES (%s, %s, %s, %s)",
            (user_id, current_time, history_data.gameId, history_data.gameType)
        )
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"status": "success", "message": "History recorded successfully"}
        
    except Exception as e:
        # Log the error
        print(f"Error recording history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record history: {str(e)}")
    
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)