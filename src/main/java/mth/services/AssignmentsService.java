package mth.services;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Assignments;
import mth.models.Teams;
import mth.repository.AssignmentsRepository;
import mth.repository.TeamsRepository;
import mth.repository.UsersRepository;
import mth.models.Users;

@Service
public class AssignmentsService {

	@Autowired
	AssignmentsRepository AR;

	@Autowired
	TeamsRepository TR;

	@Autowired
	UsersRepository UR;

	@Autowired
	JwtService JWT;

	// Create/Save Assignment
	public Object createAssignment(Map<String, Object> data, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			Assignments assignment = new Assignments();
			assignment.setTaskId((String) data.get("taskId"));
			assignment.setUserId(Long.valueOf(data.get("userId").toString()));
			assignment.setAssignedBy(Long.valueOf(payload.get("crid").toString()));
			assignment.setAssignedAt(new Timestamp(System.currentTimeMillis()));

			AR.save(assignment);

			response.put("code", 200);
			response.put("message", "Task assignment saved to PostgreSQL successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Delete Assignment by Task ID
	public Object deleteAssignment(String taskId, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			AR.deleteByTaskId(taskId);

			response.put("code", 200);
			response.put("message", "Task assignment removed from PostgreSQL successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Get All Assignments
	public Object getAllAssignments(String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			JWT.validateJWT(token);
			List<Assignments> list = AR.findAll();
			response.put("code", 200);
			response.put("assignments", list);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Get All Teams
	public Object getAllTeams(String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			JWT.validateJWT(token);
			List<Teams> list = TR.findAll();
			response.put("code", 200);
			response.put("teams", list);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Create Team (Admin/Manager only)
	public Object createTeam(Teams team, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			TR.save(team);

			response.put("code", 200);
			response.put("teamId", team.getId());
			response.put("message", "Team created successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Delete Team
	public Object deleteTeam(Long id, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			TR.deleteById(id);

			response.put("code", 200);
			response.put("message", "Team deleted successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Update Team (Admin/Manager/TeamLead)
	public Object updateTeam(Long id, Teams team, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			Teams existingTeam = TR.findById(id).orElseThrow(() -> new Exception("Team not found"));
			existingTeam.setTeamName(team.getTeamName());
			existingTeam.setDescription(team.getDescription());
			existingTeam.setLeaderId(team.getLeaderId());
			TR.save(existingTeam);

			response.put("code", 200);
			response.put("message", "Team updated successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Assign Team Lead
	public Object assignTeamLead(Long teamId, Long leaderId, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			Teams team = TR.findById(teamId).get();
			team.setLeaderId(leaderId);
			TR.save(team);

			response.put("code", 200);
			response.put("message", "Team Lead assigned successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Assign User to Team
	public Object assignUserToTeam(Long userId, Long teamId, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			int role = ((Number) payload.get("role")).intValue();
			if (role != 2 && role != 3) {
				throw new Exception("Unauthorized: Manager or Admin role required");
			}

			Users user = UR.findById(userId).get();
			if (teamId == 0L || teamId == null) {
				user.setTeamId(null);
			} else {
				user.setTeamId(teamId);
			}
			UR.save(user);

			response.put("code", 200);
			response.put("message", "User team assignment updated successfully");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Get Team Members
	public Object getTeamMembers(Long teamId, String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			JWT.validateJWT(token);
			List<Users> list = UR.findByTeamId(teamId);
			response.put("code", 200);
			response.put("users", list);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Get Unassigned Members
	public Object getUnassignedMembers(String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			JWT.validateJWT(token);
			List<Users> list = UR.findUnassignedMembers();
			response.put("code", 200);
			response.put("users", list);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	// Get All Managers
	public Object getAllManagers(String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			JWT.validateJWT(token);
			List<Users> list = UR.findAllManagers();
			response.put("code", 200);
			response.put("users", list);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}
}
