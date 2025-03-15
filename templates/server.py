from fastapi import FastAPI, Request, Form, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.templating import Jinja2Templates
import pymysql
import bcrypt

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your_secret_key")

templates = Jinja2Templates(directory="templates")

# Database connection details
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "kilohira01",
    "database": "Lost",
    "cursorclass": pymysql.cursors.DictCursor
}

def get_db_connection():
    return pymysql.connect(**db_config)

@app.get("/profile", response_class=HTMLResponse)
def get_profile(request: Request):
    username = request.session.get("username")
    if not username:
        return RedirectResponse(url="/logout")
    
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT username, email FROM user WHERE username = %s", (username,))
        user = cursor.fetchone()
    conn.close()
    
    if not user:
        return RedirectResponse(url="/logout")
    
    return templates.TemplateResponse("profile.html", {"request": request, "user": user})

@app.post("/profile/update")
def update_profile(request: Request, username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    session_username = request.session.get("username")
    if not session_username:
        return RedirectResponse(url="/logout")
    
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE user SET username=%s, email=%s, password=%s WHERE username=%s", (username, email, hashed_password, session_username))
        conn.commit()
    conn.close()
    
    request.session["username"] = username  # Update session username if changed
    return RedirectResponse(url="/profile", status_code=303)

@app.post("/profile/delete")
def delete_profile(request: Request):
    username = request.session.get("username")
    if not username:
        return RedirectResponse(url="/logout")
    
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM user WHERE username=%s", (username,))
        conn.commit()
    conn.close()
    
    request.session.clear()
    return RedirectResponse(url="/logout", status_code=303)

@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")
