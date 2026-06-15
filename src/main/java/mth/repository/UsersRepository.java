package mth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mth.models.Users;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {
	
	@Query("select U from Users U where U.email=:username and U.password=:password")
	public Object validateCredentials(@Param("username") String username, @Param("password") String password);
	
	@Query("select U.id from Users U where U.email=:email")
	public Object checkByEmail(@Param("email") String email);
	
	@Query("select U from Users U where U.email=:email")
	public Object findByEmail(@Param("email") String email);
	
	@Query("select M from Menus M join Rolesmapping R on M.mid=R.mid where R.role=:role order by M.mid")
	public List<Object> getMenus(@Param("role") Long role);
	
	@Query("select U,R from Users U left join Roles R on U.role=R.role where U.email=:email")
	public Object profileByEmail(@Param("email") String email);
	
	@Query("select U from Users U where lower(U.fullname) like concat('%', lower(:key), '%') or lower(U.email) like concat('%', lower(:key), '%')")
	public List<Object> searchUser(@Param("key") String key);

	@Query("select U from Users U where U.teamId = :teamId")
	public List<Users> findByTeamId(@Param("teamId") Long teamId);
	
	@Query("select U from Users U where U.role = 1 and U.teamId is null")
	public List<Users> findUnassignedMembers();
	
	@Query("select U from Users U where U.role = 2")
	public List<Users> findAllManagers();
}
