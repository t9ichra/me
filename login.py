import pymysql
import uuid
import json
from fastapi import FastAPI, HTTPException, Request, Form, Response, Depends
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.responses import JSONResponse

app = FastAPI()

templates = Jinja2Templates(directory=".")

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

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

@app.get("/", response_class=HTMLResponse)
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
        
        response = RedirectResponse(url="/home", status_code=303)
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
        
        response = RedirectResponse(url="/home", status_code=303)
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

@app.get("/home")
def home(request: Request):
    user_session = request.cookies.get("user_session")
    
    if user_session:
        try:
            session_data = json.loads(user_session)
            username = session_data.get("username", "Unknown Soul")
            return {"message": f"Welcome to the darkness, {username}!"}
        except:
            return {"message": "Server is connected to MySQL!"}
    else:
        return {"message": "Server is connected to MySQL!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)