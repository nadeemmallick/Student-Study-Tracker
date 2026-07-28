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
import java.util.*;
import java.util.stream.Collectors;

/**
 * AnalyticsService – Aggregates study metrics and analytics for a user.
 *
 * Day 8: Analytics & Data Visualization Module
 */
@Service
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
    public AnalyticsResponse getUserAnalytics(Long userId) {
        log.info("Generating analytics report for userId: {}", userId);

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
        LocalDate today = LocalDate.now();
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

        // 5. Build and return response
        return AnalyticsResponse.builder()
                .totalStudyHours(totalHours)
                .totalSessions(totalSessionsCount)
                .totalSubjects(subjects.size())
                .completedAssignments(completedAssignmentsCount)
                .totalAssignments(assignments.size())
                .completedGoals(completedGoalsCount)
                .totalGoals(goals.size())
                .subjectBreakdown(subjectStats)
                .weeklyTrend(weeklyTrend)
                .build();
    }
}
