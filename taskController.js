import express from "express";
import * as taskService from '../services/taskService.js';

const router = express.Router();

router.post("/createtask", async (req, res)=>{
    res.json(await taskService.createTask(req.body, req.headers["token"]));
});

router.get("/getalltasks/:PAGE/:SIZE", async (req, res)=>{
    const {PAGE, SIZE} = req.params;
    const response = await taskService.getAllTasks(PAGE, SIZE, req.headers.token);
    res.json(response);
});

router.get("/gettask/:ID", async (req, res)=>{
    const {ID} = req.params;
    const reponse = await taskService.getTask(ID, req.headers.token);
    res.json(reponse);
});

router.put("/updatetask/:ID", async (req, res)=>{
    const {ID} = req.params;
    const response = await taskService.updateTask(ID, req.body, req.headers.token);
    res.json(response);
});

router.delete("/deletetask/:ID", async (req, res)=>{
    const {ID} = req.params;
    const response = await taskService.deleteTask(ID, req.headers.token);
    res.json(response);
});

router.get("/vectorsearch/:KEY", async (req, res)=>{
    const {KEY} = req.params;
    const response = await taskService.vectorSearch(KEY, req.headers.token);
    res.json(response);
});

router.get("/recommendusers", async (req, res)=>{
    const {title, description, role} = req.query;
    const response = await taskService.recommendUsers(title, description, req.headers.token, role);
    res.json(response);
});

router.post("/journal", async (req, res)=>{
    res.json(await taskService.createJournalEntry(req.body, req.headers["token"]));
});

router.get("/journal", async (req, res)=>{
    res.json(await taskService.getJournalEntries(req.headers["token"]));
});

router.delete("/journal/:ID", async (req, res)=>{
    const {ID} = req.params;
    res.json(await taskService.deleteJournalEntry(ID, req.headers["token"]));
});

router.get("/myassignedtasks/:PAGE/:SIZE", async (req, res)=>{
    const {PAGE, SIZE} = req.params;
    const response = await taskService.getMyAssignedTasks(PAGE, SIZE, req.headers.token);
    res.json(response);
});

router.get("/dashboardstats", async (req, res)=>{
    const response = await taskService.getDashboardStats(req.headers.token);
    res.json(response);
});

export default router;