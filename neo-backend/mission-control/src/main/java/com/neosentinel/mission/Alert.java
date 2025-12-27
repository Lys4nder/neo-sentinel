package com.neosentinel.mission;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime timestamp;

    // Constructors
    public Alert() {}
    public Alert(String message) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
}