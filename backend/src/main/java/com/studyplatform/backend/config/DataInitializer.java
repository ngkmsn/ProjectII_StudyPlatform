package com.studyplatform.backend.config;

import com.studyplatform.backend.entity.User;
import com.studyplatform.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Configuration
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository) {
        return args -> {
            String testEmail = "test@example.com";
            Optional<User> existingUser = userRepository.findByEmail(testEmail);

            if (existingUser.isEmpty()) {
                User defaultUser = new User();
                defaultUser.setName("Test User");
                defaultUser.setEmail(testEmail);
                defaultUser.setPassword(passwordEncoder.encode("dummy_password"));
                userRepository.save(defaultUser);
                System.out.println("Default user created with ID: " + defaultUser.getId());
            } else {
                User user = existingUser.get();
                user.setPassword(passwordEncoder.encode("dummy_password"));
                userRepository.save(user);
                System.out.println("Test user password updated with BCrypt encoding.");
            }
        };
    }
}
