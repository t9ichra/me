from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def lobby_page(request: Request):
    return templates.TemplateResponse(
        request=request, name="looby.html", context={}
    )

@app.post("/new_game/{type}")
async def proxy_new_game(type: str, request: Request):
    import httpx
    
    async with httpx.AsyncClient() as client:
        main_api_url = "http://127.0.0.1:8000/new_game/" + type
        response = await client.post(main_api_url)
        
        return response.text

if __name__ == "__main__":
    uvicorn.run("lobby:app", host="127.0.0.1", port=8001, reload=True)