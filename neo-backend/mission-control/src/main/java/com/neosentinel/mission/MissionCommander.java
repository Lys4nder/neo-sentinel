package com.neosentinel.mission;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class MissionCommander {

    private final AlertRepository alertRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MissionCommander(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @RabbitListener(queuesToDeclare = @org.springframework.amqp.rabbit.annotation.Queue("hazard.alerts"))
    @CacheEvict(value = "alerts", allEntries = true)
    public void handleAlert(String jsonMessage) {
        System.out.println("Mission Control: Received Alert -> " + jsonMessage);

        try {
            HazardAlert hazardAlert = objectMapper.readValue(jsonMessage, HazardAlert.class);
            Alert alert = new Alert(
                hazardAlert.message(),
                hazardAlert.name(),
                hazardAlert.distanceKm(),
                hazardAlert.velocityKmS(),
                hazardAlert.diameterM()
            );
            alertRepository.save(alert);
            System.out.println("Saved to Database ID: " + alert.getId());
        } catch (Exception e) {
            // Fallback for plain string messages (backwards compatibility)
            System.err.println("Error parsing JSON, saving as plain message: " + e.getMessage());
            Alert alert = new Alert(jsonMessage);
            alertRepository.save(alert);
        }
    }
}

record HazardAlert(String message, String name, double distanceKm, double velocityKmS, double diameterM) {}