package com.studysync.service;

import com.studysync.dto.AnalyticsResponse;
import com.studysync.entity.Assignment;
import com.studysync.entity.Goal;
import com.studysync.entity.StudySession;
import com.studysync.entity.Subject;
import com.studysync.repository.AssignmentRepository;
import com.studysync.repository.GoalRepository;
import com.studysync.repository.StudySessionRepository;
import com.studysync.repository.SubjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AnalyticsService – Aggregates study metrics and analytics for a user.
 *
 * Day 8: Analytics & Data Visualization Module
 */
@Service
@SuppressWarnings("null")
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final StudySessionRepository studySessionRepository;
    private final SubjectRepository subjectRepository;
    private final AssignmentRepository assignmentRepository;
    private final GoalRepository goalRepository;

    public AnalyticsService(StudySessionRepository studySessionRepository,
                            SubjectRepository subjectRepository,
                            AssignmentRepository assignmentRepository,
                            GoalRepository goalRepository) {
        this.studySessionRepository = studySessionRepository;
        this.subjectRepository = subjectRepository;
        this.assignmentRepository = assignmentRepository;
        this.goalRepository = goalRepository;
    }

    /**
     * Aggregates all analytics data for a specific user ID.
     */
    @Transactional(readOnly = true)
    public AnalyticsResponse getUserAnalytics(Long userId, String timezone) {
        log.info("Generating analytics report for userId: {}, timezone: {}", userId, timezone);

        // 1. Fetch user data entities
        List<StudySession> sessions = studySessionRepository.findByUser_UserIdOrderByDateDescStartTimeDesc(userId);
        List<Subject> subjects = subjectRepository.findByUser_UserId(userId);
        List<Assignment> assignments = assignmentRepository.findByUser_UserIdOrderByDueDateAsc(userId);
        List<Goal> goals = goalRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);

        // 2. Metrics calculation
        int totalSessionsCount = sessions.size();
        int totalMinutes = sessions.stream()
                .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();
        double totalHours = Math.round((totalMinutes / 60.0) * 10.0) / 10.0;

        int completedAssignmentsCount = (int) assignments.stream()
                .filter(a -> a.getStatus() == Assignment.Status.COMPLETED)
                .count();

        int completedGoalsCount = (int) goals.stream()
                .filter(g -> Boolean.TRUE.equals(g.getCompleted()))
                .count();

        // 3. Subject Hours Breakdown
        Map<Long, Double> subjectHoursMap = new HashMap<>();
        for (StudySession s : sessions) {
            if (s.getSubject() != null) {
                Long subId = s.getSubject().getSubjectId();
                double hours = (s.getDurationMinutes() != null ? s.getDurationMinutes() : 0) / 60.0;
                subjectHoursMap.put(subId, subjectHoursMap.getOrDefault(subId, 0.0) + hours);
            }
        }

        List<AnalyticsResponse.SubjectStat> subjectStats = subjects.stream()
                .map(sub -> {
                    double hrs = Math.round(subjectHoursMap.getOrDefault(sub.getSubjectId(), 0.0) * 10.0) / 10.0;
                    return new AnalyticsResponse.SubjectStat(
                            sub.getSubjectId(),
                            sub.getName(),
                            sub.getColorCode() != null ? sub.getColorCode() : "#2563EB",
                            hrs
                    );
                })
                .collect(Collectors.toList());

        // 4. Last 7 Days Weekly Trend
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(timezone);
        } catch (Exception e) {
            log.warn("Invalid timezone '{}', falling back to UTC", timezone);
            zoneId = ZoneId.of("UTC");
        }
        LocalDate today = LocalDate.now(zoneId);
        Map<String, Double> weeklyTrend = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE (MM/dd)");

        // Initialize last 7 days with 0.0
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            weeklyTrend.put(d.format(formatter), 0.0);
        }

        for (StudySession s : sessions) {
            if (s.getDate() != null && !s.getDate().isBefore(today.minusDays(6)) && !s.getDate().isAfter(today)) {
                String key = s.getDate().format(formatter);
                if (weeklyTrend.containsKey(key)) {
                    double currentHrs = weeklyTrend.get(key);
                    double addHrs = (s.getDurationMinutes() != null ? s.getDurationMinutes() : 0) / 60.0;
                    weeklyTrend.put(key, Math.round((currentHrs + addHrs) * 10.0) / 10.0);
                }
            }
        }

        // 5. Last 30 Days Monthly Trend
        Map<String, Double> monthlyTrend = new LinkedHashMap<>();
        DateTimeFormatter monthlyFormatter = DateTimeFormatter.ofPattern("MMM dd");
        
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            monthlyTrend.put(d.format(monthlyFormatter), 0.0);
        }

        for (StudySession s : sessions) {
            if (s.getDate() != null && !s.getDate().isBefore(today.minusDays(29)) && !s.getDate().isAfter(today)) {
                String key = s.getDate().format(monthlyFormatter);
                if (monthlyTrend.containsKey(key)) {
                    double currentHrs = monthlyTrend.get(key);
                    double addHrs = (s.getDurationMinutes() != null ? s.getDurationMinutes() : 0) / 60.0;
                    monthlyTrend.put(key, Math.round((currentHrs + addHrs) * 10.0) / 10.0);
                }
            }
        }

        // 6. Study Streak Logic
        int currentStreak = 0;
        int bestStreak = 0;
        int missedDays = 0;

        List<LocalDate> studyDates = sessions.stream()
                .map(StudySession::getDate)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        // Missed days calculation (within the last 30 days)
        int uniqueDaysInLast30 = (int) studyDates.stream()
                .filter(d -> !d.isBefore(today.minusDays(29)) && !d.isAfter(today))
                .count();
        missedDays = 30 - uniqueDaysInLast30;

        // Current Streak Calculation
        if (!studyDates.isEmpty()) {
            LocalDate expectedDate = today;
            if (!studyDates.contains(today) && studyDates.contains(today.minusDays(1))) {
                expectedDate = today.minusDays(1);
            }
            
            for (LocalDate date : studyDates) {
                if (date.isAfter(expectedDate)) continue;
                if (date.equals(expectedDate)) {
                    currentStreak++;
                    expectedDate = expectedDate.minusDays(1);
                } else {
                    break;
                }
            }
        }

        // Best Streak Calculation
        if (!studyDates.isEmpty()) {
            List<LocalDate> ascDates = new ArrayList<>(studyDates);
            Collections.reverse(ascDates);

            int tempStreak = 1;
            bestStreak = 1;
            for (int i = 1; i < ascDates.size(); i++) {
                if (ascDates.get(i).equals(ascDates.get(i-1).plusDays(1))) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                }
            }
        }

        // 7. Build and return response
        return AnalyticsResponse.builder()
                .totalStudyHours(totalHours)
                .totalSessions(totalSessionsCount)
                .totalSubjects(subjects.size())
                .completedAssignments(completedAssignmentsCount)
                .totalAssignments(assignments.size())
                .completedGoals(completedGoalsCount)
                .totalGoals(goals.size())
                .currentStreak(currentStreak)
                .bestStreak(bestStreak)
                .missedDays(missedDays)
                .subjectBreakdown(subjectStats)
                .weeklyTrend(weeklyTrend)
                .monthlyTrend(monthlyTrend)
                .build();
    }
}
