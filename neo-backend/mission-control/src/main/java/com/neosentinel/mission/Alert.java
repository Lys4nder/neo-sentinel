package com.neosentinel.mission;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime timestamp;
    
    // Telemetry fields
    private String name;
    private Double distanceKm;
    private Double velocityKmS;
    private Double diameterM;

    // Constructors
    public Alert() {}
    public Alert(String message) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
    
    public Alert(String message, String name, Double distanceKm, Double velocityKmS, Double diameterM) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.name = name;
        this.distanceKm = distanceKm;
        this.velocityKmS = velocityKmS;
        this.diameterM = diameterM;
    }

    // Getters
    public Long getId() { return id; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getName() { return name; }
    public Double getDistanceKm() { return distanceKm; }
    public Double getVelocityKmS() { return velocityKmS; }
    public Double getDiameterM() { return diameterM; }
}