package com.neosentinel.mission;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Service
public class AlertEventService {
    
    private final Sinks.Many<Alert> alertSink = Sinks.many().multicast().onBackpressureBuffer();
    
    public void publishAlert(Alert alert) {
        alertSink.tryEmitNext(alert);
    }
    
    public Flux<Alert> getAlertStream() {
        return alertSink.asFlux();
    }
}
