import json
import pymysql
from passlib.context import CryptContext
from fastapi import FastAPI, Request, Form, HTTPException, Cookie, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI()
templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

pwd_context = CryptContext(schemes=["bcrypt"])

def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",  
        password="kilohira01",  
        database="Lost", 
        cursorclass=pymysql.cursors.DictCursor
    )

def fetch_user_info(username: str):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM user WHERE username = %s", (username,))
            return cursor.fetchone()
    finally:
        connection.close()

def update_user_info(username: str, new_username: str, email: str, password: str):
    hashed_password = pwd_context.hash(password)
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE user 
                SET username = %s, email = %s, password = %s 
                WHERE username = %s
            """, (new_username, email, hashed_password, username))
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

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return RedirectResponse(url="/manage")

@app.get("/manage", response_class=HTMLResponse)
async def get_manage_page(request: Request, username: str = Depends(get_user_from_session)):
    user_info = fetch_user_info(username)
    
    if user_info:
        return templates.TemplateResponse("manage.html", {"request": request, "user_info": user_info})
    else:
        raise HTTPException(status_code=404, detail="User not found")

@app.post("/update_account")
async def update_account(
    request: Request, 
    username: str = Form(...),
    email: str = Form(...), 
    password: str = Form(...), 
    confirmPassword: str = Form(...),
    current_username: str = Depends(get_user_from_session)  # Get username from session
):
    if password != confirmPassword:
        return templates.TemplateResponse(
            "manage.html", 
            {"request": request, "user_info": fetch_user_info(current_username), "error": "Passwords do not match"}
        )
    
    try:
        update_user_info(current_username, username, email, password)
        
        response = RedirectResponse(url="/manage", status_code=303)
        session_data = json.dumps({"username": username})
        response.set_cookie(key="user_session", value=session_data)
        
        return response
    except Exception as e:
        return templates.TemplateResponse(
            "manage.html", 
            {"request": request, "user_info": fetch_user_info(current_username), "error": str(e)}
        )
    
@app.post("/delete_account")
async def delete_account(request: Request, username: str = Depends(get_user_from_session)):
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

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)