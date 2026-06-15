from pydantic import BaseModel

class SignupSchema(BaseModel):
    fullname: str
    phone: str
    email: str
    password: str
    skills: str = ""

class SigninSchema(BaseModel):
    username: str
    password: str

class UsersSchema(BaseModel):
    fullname: str
    phone: str
    email: str
    password: str
    role: int
    status: int
    skills: str = ""

class TasksSchema(BaseModel):
    title: str
    description: str
    createdby: int
    assignedto: int = 0
    teamLeadId: int = 0
    teamMembers: list[int] = []
    priority: int
    deadline: str
    status: int