package com.neosentinel.ingest;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.UUID;

@Service
public class TelemetryProducer {

    private final KafkaTemplate<Object, Object> kafkaTemplate;
    private final Random random = new Random();

    public TelemetryProducer(KafkaTemplate<Object, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedRate = 10000)
    public void sendTelemetry() {
        AsteroidTelemetry data = new AsteroidTelemetry(
                UUID.randomUUID().toString(),
                "2025-BF",
                random.nextDouble() * 100000,
                random.nextDouble() * 20,
                random.nextDouble() * 500 + 10  // diameter between 10-510 meters
        );
        System.out.println("SENT: " + data + "; id = " + data.id());
        kafkaTemplate.send("asteroid.stream", data.id(), data);

    }

    record AsteroidTelemetry(String id, String name, double distanceKm, double velocityKmS, double diameterM) {}
}
