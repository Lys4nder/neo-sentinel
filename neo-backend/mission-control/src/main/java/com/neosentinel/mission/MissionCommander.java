package com.neosentinel.mission;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
public class MissionCommander {

    private final AlertRepository alertRepository;

    public MissionCommander(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @RabbitListener(queuesToDeclare = @org.springframework.amqp.rabbit.annotation.Queue("hazard.alerts"))
    public void handleAlert(String message) {
        System.out.println("Mission Control: Received Alert -> " + message);

        Alert alert = new Alert(message);
        alertRepository.save(alert);
        System.out.println("Saved to Database ID: " + alert.getId());
    }
}