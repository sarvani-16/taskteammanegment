package mth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Teams;
import mth.services.AssignmentsService;

@RestController
@RequestMapping("/assignment")
public class AssignmentsController {

	@Autowired
	AssignmentsService AS;

	@PostMapping("/create")
	public Object createAssignment(@RequestBody Map<String, Object> data, @RequestHeader("Token") String token) {
		return AS.createAssignment(data, token);
	}

	@DeleteMapping("/delete/{taskId}")
	public Object deleteAssignment(@PathVariable("taskId") String taskId, @RequestHeader("Token") String token) {
		return AS.deleteAssignment(taskId, token);
	}

	@GetMapping("/getall")
	public Object getAllAssignments(@RequestHeader("Token") String token) {
		return AS.getAllAssignments(token);
	}

	@GetMapping("/teams")
	public Object getAllTeams(@RequestHeader("Token") String token) {
		return AS.getAllTeams(token);
	}

	@PostMapping("/team/create")
	public Object createTeam(@RequestBody Teams team, @RequestHeader("Token") String token) {
		return AS.createTeam(team, token);
	}

	@PutMapping("/team/update/{id}")
	public Object updateTeam(@PathVariable("id") Long id, @RequestBody Teams team, @RequestHeader("Token") String token) {
		return AS.updateTeam(id, team, token);
	}

	@DeleteMapping("/team/delete/{id}")
	public Object deleteTeam(@PathVariable("id") Long id, @RequestHeader("Token") String token) {
		return AS.deleteTeam(id, token);
	}

	@PutMapping("/team/assignleader/{teamId}/{leaderId}")
	public Object assignTeamLead(@PathVariable("teamId") Long teamId, @PathVariable("leaderId") Long leaderId, @RequestHeader("Token") String token) {
		return AS.assignTeamLead(teamId, leaderId, token);
	}

	@PutMapping("/user/assignteam/{userId}/{teamId}")
	public Object assignUserToTeam(@PathVariable("userId") Long userId, @PathVariable("teamId") Long teamId, @RequestHeader("Token") String token) {
		return AS.assignUserToTeam(userId, teamId, token);
	}

	@GetMapping("/team/members/{teamId}")
	public Object getTeamMembers(@PathVariable("teamId") Long teamId, @RequestHeader("Token") String token) {
		return AS.getTeamMembers(teamId, token);
	}

	@GetMapping("/team/unassigned")
	public Object getUnassignedMembers(@RequestHeader("Token") String token) {
		return AS.getUnassignedMembers(token);
	}

	@GetMapping("/team/managers")
	public Object getAllManagers(@RequestHeader("Token") String token) {
		return AS.getAllManagers(token);
	}
}
