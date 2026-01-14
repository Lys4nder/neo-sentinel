package com.neosentinel.gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${api.key:neo-sentinel-secret-key}")
    private String apiKey;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints (for SSE and health checks)
                .pathMatchers("/api/mission/alerts/stream").permitAll()
                .pathMatchers("/actuator/**").permitAll()
                // All other API endpoints require authentication
                .pathMatchers("/api/**").authenticated()
                .anyExchange().permitAll()
            )
            .addFilterAt(apiKeyAuthenticationFilter(), SecurityWebFiltersOrder.AUTHENTICATION)
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint((exchange, ex) -> {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    exchange.getResponse().getHeaders().add("Content-Type", "application/json");
                    String body = "{\"error\":\"Unauthorized\",\"message\":\"Valid API key required. Use header: X-API-Key\"}";
                    return exchange.getResponse().writeWith(
                        Mono.just(exchange.getResponse().bufferFactory().wrap(body.getBytes()))
                    );
                })
            )
            .build();
    }

    private AuthenticationWebFilter apiKeyAuthenticationFilter() {
        AuthenticationWebFilter filter = new AuthenticationWebFilter(apiKeyAuthenticationManager());
        filter.setServerAuthenticationConverter(apiKeyConverter());
        return filter;
    }

    private ReactiveAuthenticationManager apiKeyAuthenticationManager() {
        return authentication -> {
            String providedKey = authentication.getCredentials().toString();
            if (apiKey.equals(providedKey)) {
                return Mono.just(new UsernamePasswordAuthenticationToken(
                    "api-client",
                    providedKey,
                    List.of(new SimpleGrantedAuthority("ROLE_API_USER"))
                ));
            }
            return Mono.empty();
        };
    }

    private ServerAuthenticationConverter apiKeyConverter() {
        return exchange -> {
            String apiKeyHeader = exchange.getRequest().getHeaders().getFirst("X-API-Key");
            if (apiKeyHeader != null && !apiKeyHeader.isEmpty()) {
                return Mono.just(new UsernamePasswordAuthenticationToken(apiKeyHeader, apiKeyHeader));
            }
            return Mono.empty();
        };
    }
}
