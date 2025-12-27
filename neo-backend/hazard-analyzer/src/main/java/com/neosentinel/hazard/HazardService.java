package com.neosentinel.hazard;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class HazardService {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public HazardService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @KafkaListener(topics = "asteroid.stream", groupId = "hazard-group-v2")
    public void analyzeTelemetry(String rawJson) {
        try {
            AsteroidTelemetry data = objectMapper.readValue(rawJson, AsteroidTelemetry.class);

            System.out.println("RECEIVED: " + data.name() + " distance: " + (int)data.distanceKm() + "km");

            if (data.distanceKm() < 40000) {
                System.err.println("CRITICAL HAZARD DETECTED! Sending Alert to RabbitMQ...");
                String alertMsg = "COLLISION WARNING: " + data.name() + " is " + (int)data.distanceKm() + "km away with a diameter of " + (int)data.diameterM() + " meters!";
                
                // Send structured alert with all telemetry data
                HazardAlert alert = new HazardAlert(
                    alertMsg,
                    data.name(),
                    data.distanceKm(),
                    data.velocityKmS(),
                    data.diameterM()
                );
                String alertJson = objectMapper.writeValueAsString(alert);
                rabbitTemplate.convertAndSend("hazard.alerts", alertJson);
            }
        } catch (Exception e) {
            System.err.println("Error parsing JSON: " + e.getMessage());
        }
    }
}

record AsteroidTelemetry(String id, String name, double distanceKm, double velocityKmS, double diameterM) {}

record HazardAlert(String message, String name, double distanceKm, double velocityKmS, double diameterM) {}