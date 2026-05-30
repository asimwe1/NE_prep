package com.erp.erp_system.common.security;

import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employees.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final EmployeeRepository employeeRepository;

    /** Loads an employee account for Spring Security authentication. */
    @Override
    public UserDetails loadUserByUsername(String email) {
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        String[] roles = employee.getRoles().stream().map(Enum::name).toArray(String[]::new);
        return User.withUsername(employee.getEmail())
                .password(employee.getPassword())
                .authorities(roles)
                .disabled(employee.getStatus().name().equals("DISABLED"))
                .build();
    }
}
