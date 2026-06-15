import Tasks from "../models/tasks.js";
import Journals from "../models/journal.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ActivityLogs from "../models/activityLogs.js";
import TaskEmbeddings from "../models/taskEmbeddings.js";
import { getEmbedding, getCosineSimilarity } from "./embeddingService.js";

dotenv.config();

const SECRETE_KEY = process.env.SECRETE_KEY;

export async function createTask(data, token){
    let response;
    try
    {
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization
        if (payload.role !== 2 && payload.role !== 3) {
            return {code: 403, message: "Forbidden: Only managers and admins can create tasks"};
        }
        data.createdby = payload.crid;
        data.assignedto = data.teamLeadId || 0;
        const task = await Tasks.create(data); //Insert into MongoDB
        
        // Generate and save embedding
        const textToEmbed = data.title + " " + data.description;
        const embedding = getEmbedding(textToEmbed);
        await TaskEmbeddings.create({
            task_id: task._id.toString(),
            embedding: embedding,
            text: textToEmbed
        });

        // Log task creation activity
        await ActivityLogs.create({
            task_id: task._id.toString(),
            user_id: payload.crid,
            action: "created"
        });

        // Sync assignment to PostgreSQL
        try {
            // Sync Team Lead assignment
            await fetch("http://localhost:8001/assignment/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Token": token
                },
                body: JSON.stringify({
                    taskId: task._id.toString(),
                    userId: data.teamLeadId
                })
            });

            // Sync Team Member assignments
            if (data.teamMembers && Array.isArray(data.teamMembers)) {
                for (const memberId of data.teamMembers) {
                    await fetch("http://localhost:8001/assignment/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Token": token
                        },
                        body: JSON.stringify({
                            taskId: task._id.toString(),
                            userId: memberId
                        })
                    });
                }
            }

            // Sync Team Creation to PostgreSQL Teams Table (Only for Managers / Admins: role = 3)
            if (payload.role === 3) {
                const teamResponse = await fetch("http://localhost:8001/assignment/team/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Token": token
                    },
                    body: JSON.stringify({
                        teamName: data.title,
                        description: data.description,
                        leaderId: data.teamLeadId
                    })
                });
                const teamResult = await teamResponse.json();
                if (teamResult.code === 200 && teamResult.teamId) {
                    const teamId = teamResult.teamId;
                    if (data.teamMembers && Array.isArray(data.teamMembers)) {
                        for (const memberId of data.teamMembers) {
                            await fetch(`http://localhost:8001/assignment/user/assignteam/${memberId}/${teamId}`, {
                                method: "PUT",
                                headers: {
                                    "Token": token
                                }
                            });
                        }
                    }
                }
            }
        } catch (dbErr) {
            console.error("PostgreSQL sync error:", dbErr.message);
        }

        response = {code: 200, message: "New task has been created"};
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Get All Tasks
export async function getAllTasks(page, size, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization

        //Pagination Calculation
        const skip = (page -1) * size;

        const tasks = await Tasks.find({createdby: payload.crid})
                                .skip(skip)         //Skip records for pagination
                                .limit(size)        //No of records to be fetched per page
                                .sort({_id: 1});    //Ascending order by _id (-1 for Descending order)

        const totalrecords = await Tasks.countDocuments({createdby: payload.crid});

        response = {code: 200, page: page, size: size, totalpages: Math.ceil(totalrecords / size), tasks: tasks};
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Get Task
export async function getTask(id, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization

        const task = await Tasks.findById({_id: id});

        response = {code: 200, task: task};
    }catch(e){
        response = {code: 500, message: e.message};
    }
    return response;
}

//Update Task
export async function updateTask(id, data, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization
        const task = await Tasks.findById(id);
        if (!task) {
            return {code: 404, message: "Task not found"};
        }

        let updatedAction = "updated";
        if (payload.role === 1 || payload.role === 2) {
            const isAssigned = task.teamLeadId === payload.crid || 
                               (task.teamMembers && task.teamMembers.includes(payload.crid)) || 
                               task.assignedto === payload.crid;
            if (!isAssigned) {
                return {code: 403, message: "Forbidden: You can only update tasks assigned to you"};
            }
            const statusText = data.status === 1 ? "In-Progress" : data.status === 2 ? "Completed" : "Assigned";
            updatedAction = `updated status to ${statusText}`;
            task.status = data.status;
            if (data.submission !== undefined) {
                task.submission = data.submission;
            }
            await task.save();
        } else {
            const oldTitle = task.title;
            data.assignedto = data.teamLeadId || 0;
            await Tasks.findOneAndUpdate({_id: id}, data);
            
            // Generate and update embedding
            const textToEmbed = data.title + " " + data.description;
            const embedding = getEmbedding(textToEmbed);
            await TaskEmbeddings.findOneAndUpdate(
                { task_id: id },
                { embedding: embedding, text: textToEmbed },
                { upsert: true }
            );

            // Sync assignment update to PostgreSQL
            try {
                // Delete old assignment
                await fetch(`http://localhost:8001/assignment/delete/${id}`, {
                    method: "DELETE",
                    headers: { "Token": token }
                });

                // Sync Team Lead assignment
                await fetch("http://localhost:8001/assignment/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Token": token
                    },
                    body: JSON.stringify({
                        taskId: id,
                        userId: data.teamLeadId
                    })
                });

                // Sync Team Member assignments
                if (data.teamMembers && Array.isArray(data.teamMembers)) {
                    for (const memberId of data.teamMembers) {
                        await fetch("http://localhost:8001/assignment/create", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Token": token
                            },
                            body: JSON.stringify({
                                taskId: id,
                                userId: memberId
                            })
                        });
                    }
                }

                // Sync Team details to PostgreSQL Teams Table
                // 1. Fetch all teams to find the one matching oldTitle
                const teamsResponse = await fetch("http://localhost:8001/assignment/teams", {
                    headers: { "Token": token }
                });
                const teamsData = await teamsResponse.json();
                let matchedTeam = null;
                if (teamsData.code === 200 && Array.isArray(teamsData.teams)) {
                    matchedTeam = teamsData.teams.find(t => t.teamName === oldTitle);
                }

                if (matchedTeam) {
                    const teamId = matchedTeam.id;
                    // 2. Fetch old members of this team and unassign them
                    const oldMembersResponse = await fetch(`http://localhost:8001/assignment/team/members/${teamId}`, {
                        headers: { "Token": token }
                    });
                    const oldMembersData = await oldMembersResponse.json();
                    if (oldMembersData.code === 200 && Array.isArray(oldMembersData.users)) {
                        for (const u of oldMembersData.users) {
                            await fetch(`http://localhost:8001/assignment/user/assignteam/${u.id}/0`, {
                                method: "PUT",
                                headers: { "Token": token }
                            });
                        }
                    }

                    // 3. Update the team row in PostgreSQL
                    await fetch(`http://localhost:8001/assignment/team/update/${teamId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Token": token
                        },
                        body: JSON.stringify({
                            teamName: data.title,
                            description: data.description,
                            leaderId: data.teamLeadId
                        })
                    });

                    // 4. Assign new members to the team in PostgreSQL
                    if (data.teamMembers && Array.isArray(data.teamMembers)) {
                        for (const memberId of data.teamMembers) {
                            await fetch(`http://localhost:8001/assignment/user/assignteam/${memberId}/${teamId}`, {
                                method: "PUT",
                                headers: { "Token": token }
                            });
                        }
                    }
                } else {
                    // Create a new team if it didn't exist
                    const teamResponse = await fetch("http://localhost:8001/assignment/team/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Token": token
                        },
                        body: JSON.stringify({
                            teamName: data.title,
                            description: data.description,
                            leaderId: data.teamLeadId
                        })
                    });
                    const teamResult = await teamResponse.json();
                    if (teamResult.code === 200 && teamResult.teamId) {
                        const teamId = teamResult.teamId;
                        if (data.teamMembers && Array.isArray(data.teamMembers)) {
                            for (const memberId of data.teamMembers) {
                                await fetch(`http://localhost:8001/assignment/user/assignteam/${memberId}/${teamId}`, {
                                    method: "PUT",
                                    headers: { "Token": token }
                                });
                            }
                        }
                    }
                }
            } catch (dbErr) {
                console.error("PostgreSQL sync update error:", dbErr.message);
            }
        }

        // Log task update activity
        await ActivityLogs.create({
            task_id: id,
            user_id: payload.crid,
            action: updatedAction
        });

        response = {code: 200, message: "Task updated successfully"};
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Delete Task
export async function deleteTask(id, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization
        if (payload.role !== 2 && payload.role !== 3) {
            return {code: 403, message: "Forbidden: Only managers and admins can delete tasks"};
        }

        const task = await Tasks.findById(id);
        if (!task) {
            return {code: 404, message: "Task not found"};
        }

        await Tasks.findOneAndDelete({_id: id});
        
        // Delete from task embeddings
        await TaskEmbeddings.findOneAndDelete({task_id: id});

        // Sync delete assignment to PostgreSQL
        try {
            await fetch(`http://localhost:8001/assignment/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Token": token
                }
            });

            // Find the team with name matching task.title (Only for Managers / Admins: role = 3)
            if (payload.role === 3) {
                const teamsResponse = await fetch("http://localhost:8001/assignment/teams", {
                    headers: { "Token": token }
                });
                const teamsData = await teamsResponse.json();
                if (teamsData.code === 200 && Array.isArray(teamsData.teams)) {
                    const matchedTeam = teamsData.teams.find(t => t.teamName === task.title);
                    if (matchedTeam) {
                        const teamId = matchedTeam.id;
                        // Fetch members and unassign them
                        const oldMembersResponse = await fetch(`http://localhost:8001/assignment/team/members/${teamId}`, {
                            headers: { "Token": token }
                        });
                        const oldMembersData = await oldMembersResponse.json();
                        if (oldMembersData.code === 200 && Array.isArray(oldMembersData.users)) {
                            for (const u of oldMembersData.users) {
                                await fetch(`http://localhost:8001/assignment/user/assignteam/${u.id}/0`, {
                                    method: "PUT",
                                    headers: { "Token": token }
                                });
                            }
                        }
                        // Delete the team record from PostgreSQL
                        await fetch(`http://localhost:8001/assignment/team/delete/${teamId}`, {
                            method: "DELETE",
                            headers: { "Token": token }
                        });
                    }
                }
            }
        } catch (dbErr) {
            console.error("PostgreSQL sync delete error:", dbErr.message);
        }

        response = {code: 200, message: "Task has been deleted"};
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Vector Search / Keyword Search
export async function vectorSearch(key, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization
        
        // Generate query embedding
        const queryVec = getEmbedding(key);
        
        // Retrieve task embeddings
        const taskEmbeds = await TaskEmbeddings.find({});
        
        // Calculate similarity for each task
        const scoredTasks = [];
        for (const item of taskEmbeds) {
            const score = getCosineSimilarity(queryVec, item.embedding);
            if (score > 0.1) {
                scoredTasks.push({ task_id: item.task_id, score: score });
            }
        }
        
        // Sort by similarity descending
        scoredTasks.sort((a, b) => b.score - a.score);
        
        const taskIds = scoredTasks.map(x => x.task_id);
        
        // Fetch original tasks matching these IDs and role scope
        const query = { _id: { $in: taskIds } };
        if (payload.role === 1) {
            query.assignedto = payload.crid;
        } else {
            query.createdby = payload.crid;
        }
        
        const tasks = await Tasks.find(query);
        
        // Sort the tasks array to match the order of scoredTasks and attach similarity score
        const tasksMap = {};
        tasks.forEach(t => {
            tasksMap[t._id.toString()] = t;
        });
        
        const sortedTasks = [];
        taskIds.forEach(id => {
            if (tasksMap[id]) {
                const taskObj = tasksMap[id].toObject();
                const scored = scoredTasks.find(x => x.task_id === id);
                if (scored) {
                    taskObj.score = parseFloat(scored.score.toFixed(4));
                }
                sortedTasks.push(taskObj);
            }
        });
        
        // Fallback to text search if no vector matches found
        if (sortedTasks.length === 0) {
            const regexQuery = {
                $or: [
                    {title: {$regex: key, $options: 'i'}},
                    {description: {$regex: key, $options: 'i'}}
                ]
            };
            if (payload.role === 1) {
                regexQuery.assignedto = payload.crid;
            } else {
                regexQuery.createdby = payload.crid;
            }
            const regexTasks = await Tasks.find(regexQuery).sort({_id: 1});
            const regexTasksWithScore = regexTasks.map(t => {
                const taskObj = t.toObject();
                taskObj.score = 1.0; // Perfect exact text match score
                return taskObj;
            });
            response = {code: 200, tasks: regexTasksWithScore};
        } else {
            response = {code: 200, tasks: sortedTasks};
        }
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Get My Assigned Tasks
export async function getMyAssignedTasks(page, size, token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization

        const skip = (page - 1) * size;
        let query;
        if (payload.role === 1) {
            query = {
                $and: [
                    { $or: [{ teamMembers: { $in: [payload.crid] } }, { assignedto: payload.crid }] },
                    { $expr: { $eq: ["$createdby", "$teamLeadId"] } }
                ]
            };
        } else {
            query = { $or: [{ teamLeadId: payload.crid }, { teamMembers: { $in: [payload.crid] } }, { assignedto: payload.crid }] };
        }

        const tasks = await Tasks.find(query)
                                .skip(skip)
                                .limit(size)
                                .sort({_id: 1});

        const totalrecords = await Tasks.countDocuments(query);

        response = {code: 200, page: page, size: size, totalpages: Math.ceil(totalrecords / size), tasks: tasks};
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

//Get Dashboard Stats
export async function getDashboardStats(token)
{
    let response;
    try{
        const payload = jwt.verify(token, SECRETE_KEY); //Authorization
        const role = payload.role;
        const crid = payload.crid;

        if (role === 1) {
            const query = { $or: [{ teamLeadId: crid }, { teamMembers: { $in: [crid] } }, { assignedto: crid }] };
            const totalTasks = await Tasks.countDocuments(query);
            const assignedCount = await Tasks.countDocuments({ ...query, status: 0 });
            const inProgressCount = await Tasks.countDocuments({ ...query, status: 1 });
            const completedCount = await Tasks.countDocuments({ ...query, status: 2 });

            const recentTasks = await Tasks.find({ ...query, status: { $ne: 2 } })
                                           .limit(5)
                                           .sort({deadline: 1});

            response = {
                code: 200,
                role: role,
                stats: {
                    total: totalTasks,
                    assigned: assignedCount,
                    inProgress: inProgressCount,
                    completed: completedCount
                },
                recentTasks: recentTasks
            };
        } else if (role === 2) {
            const query = { $or: [{ teamLeadId: crid }, { teamMembers: { $in: [crid] } }, { assignedto: crid }] };
            const totalTasks = await Tasks.countDocuments(query);
            const assignedCount = await Tasks.countDocuments({ ...query, status: 0 });
            const inProgressCount = await Tasks.countDocuments({ ...query, status: 1 });
            const completedCount = await Tasks.countDocuments({ ...query, status: 2 });

            const recentTasks = await Tasks.find({ ...query, status: { $ne: 2 } })
                                           .limit(5)
                                           .sort({deadline: 1});

            // Calculate teamStats for the team lead's sub-tasks (where they are createdby)
            const tasksCreatedByLead = await Tasks.find({ createdby: crid });
            const teamStats = {};
            tasksCreatedByLead.forEach(task => {
                if (task.assignedto && task.assignedto !== crid) {
                    const userId = task.assignedto;
                    if (!teamStats[userId]) {
                        teamStats[userId] = { total: 0, completed: 0 };
                    }
                    teamStats[userId].total += 1;
                    if (task.status === 2) {
                        teamStats[userId].completed += 1;
                    }
                }
                if (task.teamMembers && Array.isArray(task.teamMembers)) {
                    task.teamMembers.forEach(userId => {
                        if (userId !== crid) {
                            if (!teamStats[userId]) {
                                teamStats[userId] = { total: 0, completed: 0 };
                            }
                            teamStats[userId].total += 1;
                            if (task.status === 2) {
                                teamStats[userId].completed += 1;
                            }
                        }
                    });
                }
            });

            response = {
                code: 200,
                role: role,
                stats: {
                    total: totalTasks,
                    assigned: assignedCount,
                    inProgress: inProgressCount,
                    completed: completedCount
                },
                recentTasks: recentTasks,
                teamStats: teamStats
            };
        } else {
            const totalTasks = await Tasks.countDocuments({createdby: crid});
            const assignedCount = await Tasks.countDocuments({createdby: crid, status: 0});
            const inProgressCount = await Tasks.countDocuments({createdby: crid, status: 1});
            const completedCount = await Tasks.countDocuments({createdby: crid, status: 2});

            const tasks = await Tasks.find({createdby: crid});
            const teamStats = {};
            tasks.forEach(task => {
                const userId = task.teamLeadId || task.assignedto;
                if (userId) {
                    if (!teamStats[userId]) {
                        teamStats[userId] = { total: 0, completed: 0 };
                    }
                    teamStats[userId].total += 1;
                    if (task.status === 2) {
                        teamStats[userId].completed += 1;
                    }
                }
            });

            response = {
                code: 200,
                role: role,
                stats: {
                    total: totalTasks,
                    assigned: assignedCount,
                    inProgress: inProgressCount,
                    completed: completedCount
                },
                teamStats: teamStats
            };
        }
    }catch(e)
    {
        response = {code: 500, message: e.message};
    }
    return response;
}

export async function recommendUsers(title, description, token, roleFilter) {
    try {
        const userRes = await fetch("http://localhost:8001/user/getallusers/1/1000", {
            headers: { "Token": token }
        });
        const userData = await userRes.json();
        if (userData.code !== 200) {
            return { code: userData.code, message: userData.message };
        }
        
        const users = userData.users || [];
        const filterRole = roleFilter !== undefined ? parseInt(roleFilter) : 1;
        const members = users.filter(u => u.role === filterRole);
        
        const taskText = (title || "") + " " + (description || "");
        const taskVec = getEmbedding(taskText);
        
        const scoredMembers = members.map(user => {
            const skillsText = user.skills || "";
            const skillsVec = getEmbedding(skillsText);
            const score = getCosineSimilarity(taskVec, skillsVec);
            return {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                skills: user.skills || "None",
                score: parseFloat(score.toFixed(4))
            };
        });
        
        scoredMembers.sort((a, b) => b.score - a.score);
        
        return { code: 200, users: scoredMembers };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

// Journal Services
export async function createJournalEntry(data, token) {
    try {
        const payload = jwt.verify(token, SECRETE_KEY);
        const entry = await Journals.create({
            userId: payload.crid,
            content: data.content
        });
        return { code: 200, message: "Journal entry saved successfully", entry };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

export async function getJournalEntries(token) {
    try {
        const payload = jwt.verify(token, SECRETE_KEY);
        const entries = await Journals.find({ userId: payload.crid }).sort({ _id: -1 });
        return { code: 200, entries };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}

export async function deleteJournalEntry(id, token) {
    try {
        const payload = jwt.verify(token, SECRETE_KEY);
        const result = await Journals.findOneAndDelete({ _id: id, userId: payload.crid });
        if (!result) {
            return { code: 404, message: "Journal entry not found or unauthorized" };
        }
        return { code: 200, message: "Journal entry deleted successfully" };
    } catch (e) {
        return { code: 500, message: e.message };
    }
}