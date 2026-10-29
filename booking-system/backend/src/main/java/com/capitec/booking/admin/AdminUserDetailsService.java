package com.capitec.booking.admin;

import com.capitec.booking.admin.domain.AdminUser;
import com.capitec.booking.admin.domain.AdminUserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository admins;

    public AdminUserDetailsService(AdminUserRepository admins) {
        this.admins = admins;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AdminUser admin = admins.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No such admin: " + username));
        return User.builder()
                .username(admin.getUsername())
                .password(admin.getPasswordHash())
                .roles("ADMIN")
                .build();
    }
}
