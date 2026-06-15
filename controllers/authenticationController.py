from fastapi import APIRouter, Header
from models.schemas import SigninSchema, SignupSchema, UsersSchema
import httpx

router = APIRouter(prefix="/authservice")

SPRING_URL = "http://localhost:8001/"

@router.post("/signup")
async def signup(U: SignupSchema):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPRING_URL + "user/signup",
            json=U.model_dump()   # Send data to Spring
        )
    return response.json() # Returs back the response received from spring

@router.post("/signin")
async def signin(U: SigninSchema):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPRING_URL + "user/signin",
            json=U.model_dump()
        )
    return response.json()


@router.get("/uinfo")
async def uinfo(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "user/uinfo",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/profile")
async def profile(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "user/profile",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/getallusers/{PAGE}/{SIZE}")
async def getAllUsers(PAGE: int, SIZE: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SPRING_URL}user/getallusers/{PAGE}/{SIZE}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/getuser/{ID}")
async def getUser(ID: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SPRING_URL}user/getuser/{ID}",
            headers = {"Token": Token}
        )
    return response.json()

@router.post("/saveuser")
async def saveUser(U: UsersSchema, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPRING_URL + "user/saveuser",
            json=U.model_dump(),
            headers = {"Token": Token}
        )
    return response.json()

@router.put("/updateuser/{ID}")
async def updateUser(ID: int, U: UsersSchema, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            SPRING_URL + f"user/updateuser/{ID}",
            json=U.model_dump(),
            headers = {"Token": Token}
        )
    return response.json()

@router.delete("/deleteuser/{ID}")
async def deleteUser(ID: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            SPRING_URL + f"user/deleteuser/{ID}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/searchuser/{KEY}")
async def searchUser(KEY: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + f"user/searchuser/{KEY}",
            headers = {"Token": Token}
        )
    return response.json()

@router.post("/assignment/create")
async def createAssignment(data: dict, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPRING_URL + "assignment/create",
            json=data,
            headers = {"Token": Token}
        )
    return response.json()

@router.delete("/assignment/delete/{taskId}")
async def deleteAssignment(taskId: str, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            SPRING_URL + f"assignment/delete/{taskId}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/assignment/getall")
async def getAllAssignments(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "assignment/getall",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/assignment/teams")
async def getAllTeams(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "assignment/teams",
            headers = {"Token": Token}
        )
    return response.json()

@router.post("/assignment/team/create")
async def createTeam(team: dict, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPRING_URL + "assignment/team/create",
            json=team,
            headers = {"Token": Token}
        )
    return response.json()

@router.put("/assignment/team/update/{id}")
async def updateTeam(id: int, team: dict, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            SPRING_URL + f"assignment/team/update/{id}",
            json=team,
            headers = {"Token": Token}
        )
    return response.json()

@router.delete("/assignment/team/delete/{id}")
async def deleteTeam(id: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            SPRING_URL + f"assignment/team/delete/{id}",
            headers = {"Token": Token}
        )
    return response.json()

@router.put("/assignment/team/assignleader/{teamId}/{leaderId}")
async def assignTeamLead(teamId: int, leaderId: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            SPRING_URL + f"assignment/team/assignleader/{teamId}/{leaderId}",
            headers = {"Token": Token}
        )
    return response.json()

@router.put("/assignment/user/assignteam/{userId}/{teamId}")
async def assignUserToTeam(userId: int, teamId: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            SPRING_URL + f"assignment/user/assignteam/{userId}/{teamId}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/assignment/team/members/{teamId}")
async def getTeamMembers(teamId: int, Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + f"assignment/team/members/{teamId}",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/assignment/team/unassigned")
async def getUnassignedMembers(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "assignment/team/unassigned",
            headers = {"Token": Token}
        )
    return response.json()

@router.get("/assignment/team/managers")
async def getAllManagers(Token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            SPRING_URL + "assignment/team/managers",
            headers = {"Token": Token}
        )
    return response.json()