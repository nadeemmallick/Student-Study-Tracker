package com.studysync.controller;

import com.studysync.dto.AnalyticsResponse;
import com.studysync.service.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AnalyticsController – REST endpoint for fetching user study analytics.
 *
 * Day 8: Analytics & Data Visualization Module
 *
 * Endpoint:
 *   GET /api/analytics?userId={id} – returns aggregated study metrics
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(@RequestParam Long userId) {
        log.info("GET /api/analytics?userId={}", userId);
        AnalyticsResponse response = analyticsService.getUserAnalytics(userId);
        return ResponseEntity.ok(response);
    }
}
