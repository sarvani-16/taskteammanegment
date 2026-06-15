package mth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import mth.models.Teams;

@Repository
public interface TeamsRepository extends JpaRepository<Teams, Long> {
}
