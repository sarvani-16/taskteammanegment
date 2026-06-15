package mth.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import mth.models.Assignments;

@Repository
public interface AssignmentsRepository extends JpaRepository<Assignments, Long> {
	List<Assignments> findByUserId(Long userId);
	
	@Transactional
	void deleteByTaskId(String taskId);
}
