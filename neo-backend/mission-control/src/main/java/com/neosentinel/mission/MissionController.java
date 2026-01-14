package com.neosentinel.mission;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/mission")
public class MissionController {

    private final AlertRepository alertRepository;
    private final AlertEventService alertEventService;

    public MissionController(AlertRepository alertRepository, AlertEventService alertEventService) {
        this.alertRepository = alertRepository;
        this.alertEventService = alertEventService;
    }

    @GetMapping("/alerts")
    @Cacheable(value = "alerts", key = "'all_alerts'")
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }
    
    @GetMapping(value = "/alerts/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Alert> streamAlerts() {
        return alertEventService.getAlertStream();
    }
}