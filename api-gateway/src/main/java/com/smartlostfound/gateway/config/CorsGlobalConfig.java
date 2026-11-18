package com.smartlostfound.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration CORS globale pour Spring Cloud Gateway (réactif / WebFlux).
 *
 * <p><strong>Architecture CORS choisie :</strong></p>
 * <ul>
 *   <li>CORS géré <em>uniquement</em> ici via {@link CorsWebFilter} — source unique de vérité.</li>
 *   <li>Le {@code globalcors} YAML est intentionnellement absent pour éviter le double
 *       en-tête {@code Access-Control-Allow-Origin} qui bloque les navigateurs.</li>
 *   <li>Le {@code @CrossOrigin} a été retiré du {@code NotificationController} côté service
 *       pour la même raison.</li>
 * </ul>
 *
 * <p><strong>Règle clé :</strong> {@code allowCredentials(true)} est incompatible avec
 * {@code allowedOrigins("*")}. On liste donc les origines explicitement.</p>
 */
@Configuration
public class CorsGlobalConfig {

    /**
     * Origines autorisées en développement.
     * Ajoutez ici l'URL de production si nécessaire.
     */
    private static final List<String> ALLOWED_ORIGINS = Arrays.asList(
            "http://localhost:3000",   // CRA / Docker
            "http://localhost:5173",   // Vite dev server
            "http://localhost:4200",   // Angular (réserve)
            "http://127.0.0.1:5173"
    );

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Origines explicites et patterns (autorise n'importe quel port de dev localhost)
        config.setAllowedOrigins(ALLOWED_ORIGINS);
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");

        // Méthodes HTTP autorisées
        config.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name(),
                HttpMethod.PATCH.name()
        ));

        // Headers autorisés dans les requêtes entrantes
        config.setAllowedHeaders(Arrays.asList(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                HttpHeaders.ACCEPT,
                HttpHeaders.ORIGIN,
                "X-Requested-With"
        ));

        // Headers exposés dans les réponses
        config.setExposedHeaders(Arrays.asList(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE
        ));

        // Autorise l'envoi de cookies / JWT dans les requêtes
        config.setAllowCredentials(true);

        // Cache preflight pendant 1 heure
        config.setMaxAge(3600L);

        // Applique cette config à TOUTES les routes ("/**")
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
