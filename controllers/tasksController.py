from fastapi import APIRouter, Header
from models.schemas import TasksSchema
import httpx

router = APIRouter(prefix="/taskservice")

NODE_URL = "http://localhost:8002/"

@router.post("/createtask")
async def createTask(T: TasksSchema, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            NODE_URL + "task/createtask",
            json=T.model_dump(),
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/getalltasks/{PAGE}/{SIZE}")
async def getAllTasks(PAGE: int, SIZE:int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + f"task/getalltasks/{PAGE}/{SIZE}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/vectorsearch/{KEY}")
async def vectorSearch(KEY: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + f"task/vectorsearch/{KEY}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/gettask/{ID}")
async def vectorSearch(ID: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + f"task/gettask/{ID}",
            headers = {"Token": Token}
        )
    return response.json()

@router.put("/updatetask/{ID}")
async def vectorSearch(ID: str, data: TasksSchema, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            NODE_URL + f"task/updatetask/{ID}",
            json=data.model_dump(),
            headers = {"Token": Token}
        )
    return response.json()

@router.delete("/deletetask/{ID}")
async def vectorSearch(ID: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            NODE_URL + f"task/deletetask/{ID}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/myassignedtasks/{PAGE}/{SIZE}")
async def myAssignedTasks(PAGE: int, SIZE: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + f"task/myassignedtasks/{PAGE}/{SIZE}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/dashboardstats")
async def dashboardStats(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + "task/dashboardstats",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/recommendusers")
async def recommendUsers(title: str, description: str, role: int = 1, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + f"task/recommendusers?title={title}&description={description}&role={role}",
            headers = {"Token": Token}
        )
    return response.json()

@router.post("/journal")
async def createJournalEntry(data: dict, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            NODE_URL + "task/journal",
            json=data,
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/journal")
async def getJournalEntries(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            NODE_URL + "task/journal",
            headers = {"Token": Token}
        )
    return response.json()

@router.delete("/journal/{ID}")
async def deleteJournalEntry(ID: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            NODE_URL + f"task/journal/{ID}",
            headers = {"Token": Token}
        )
    return response.json()