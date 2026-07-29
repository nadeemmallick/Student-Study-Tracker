package com.studysync.controller;

import com.studysync.dto.AnalyticsResponse;
import com.studysync.service.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * AnalyticsController – REST endpoint for fetching user study analytics.
 *
 * Day 8: Analytics & Data Visualization Module
 * Day 10: Removed @CrossOrigin(*) — CORS handled globally in SecurityConfig.
 *         userId is now extracted from the JWT token via authentication.getDetails().
 *
 * Endpoint:
 *   GET /api/analytics – returns aggregated study metrics for authenticated user
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "UTC") String timezone) {
        Long userId = (Long) authentication.getDetails();
        log.info("GET /api/analytics — userId={}, timezone={}", userId, timezone);
        AnalyticsResponse response = analyticsService.getUserAnalytics(userId, timezone);
        return ResponseEntity.ok(response);
    }
}
