package com.neosentinel.ingest;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.UUID;

/**
 * Ahoy! This here be the TelemetryProducer — the crow's nest of our fine vessel!
 * She watches the skies and fires asteroid telemetry data into the Kafka seas
 * every 10 seconds, regular as the tides. Argh, no space rock shall pass
 * uncharted on our watch!
 */
@Service
public class TelemetryProducer {

    /**
     * Avast! This be our trusty KafkaTemplate — the cannon we use to blast
     * serialised AsteroidTelemetry payloads across the "asteroid.stream" topic.
     * Without it, our telemetry goes to Davy Jones' locker!
     */
    private final KafkaTemplate<Object, Object> kafkaTemplate;

    /**
     * Blimey! A Random number generator, used to simulate sensor readings
     * for distance, velocity, and diameter. Aye, every pirate needs a bit
     * of chaos in their measurements!
     */
    private final Random random = new Random();

    /**
     * Shiver me timbers! Constructor that injects the KafkaTemplate via
     * Spring's dependency injection. Without this mighty cannon handed to
     * us at birth, we'd be firing blanks into the void, argh!
     *
     * @param kafkaTemplate the Kafka cannon for dispatching telemetry broadsides
     */
    public TelemetryProducer(KafkaTemplate<Object, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Aye aye! This scheduled method fires every 10,000 milliseconds (10 seconds)
     * like clockwork, assembling a fresh AsteroidTelemetry payload with randomised
     * sensor data and launching it onto the "asteroid.stream" Kafka topic.
     * Argh, she never sleeps — a true pirate of the cosmos!
     */
    @Scheduled(fixedRate = 10000)
    public void sendTelemetry() {
        AsteroidTelemetry data = new AsteroidTelemetry(
                UUID.randomUUID().toString(),
                "2025-BF",
                random.nextDouble() * 100000,
                random.nextDouble() * 20,
                random.nextDouble() * 500 + 10  // Blimey! diameter between 10-510 meters — some be mighty boulders!
        );
        System.out.println("SENT: " + data + "; id = " + data.id());
        kafkaTemplate.send("asteroid.stream", data.id(), data);

    }

    /**
     * Ahoy, this compact record be the treasure chest holding all asteroid telemetry!
     * She carries the UUID identifier, the asteroid's name, its distance in kilometres,
     * velocity in km/s, and diameter in metres. Aye, immutable as the stars themselves —
     * Java records keep our data shipshape and honest, argh!
     *
     * @param id          the UUID uniquely identifying this here telemetry reading
     * @param name        the designation of the asteroid spotted on the horizon
     * @param distanceKm  how far the blighter is from our vessel, in kilometres
     * @param velocityKmS the speed at which this cannonball of rock is hurtling, in km/s
     * @param diameterM   the girth of the beast, measured in metres — avast, some be enormous!
     */
    record AsteroidTelemetry(String id, String name, double distanceKm, double velocityKmS, double diameterM) {}
}
