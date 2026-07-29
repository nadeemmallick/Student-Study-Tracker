package com.studysync.dto;

import java.util.List;
import java.util.Map;

/**
 * AnalyticsResponse – DTO for aggregated study statistics and charts data.
 *
 * Day 8: Analytics & Data Visualization Module
 */
public class AnalyticsResponse {

    private Double totalStudyHours;
    private Integer totalSessions;
    private Integer totalSubjects;
    private Integer completedAssignments;
    private Integer totalAssignments;
    private Integer completedGoals;
    private Integer totalGoals;
    
    // Charts Data
    private List<SubjectStat> subjectBreakdown;
    private Map<String, Double> weeklyTrend; // Date -> Hours
    private Map<String, Double> monthlyTrend; // Date -> Hours

    public AnalyticsResponse() {}

    private AnalyticsResponse(Builder builder) {
        this.totalStudyHours = builder.totalStudyHours;
        this.totalSessions = builder.totalSessions;
        this.totalSubjects = builder.totalSubjects;
        this.completedAssignments = builder.completedAssignments;
        this.totalAssignments = builder.totalAssignments;
        this.completedGoals = builder.completedGoals;
        this.totalGoals = builder.totalGoals;
        this.subjectBreakdown = builder.subjectBreakdown;
        this.weeklyTrend = builder.weeklyTrend;
        this.monthlyTrend = builder.monthlyTrend;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Double totalStudyHours = 0.0;
        private Integer totalSessions = 0;
        private Integer totalSubjects = 0;
        private Integer completedAssignments = 0;
        private Integer totalAssignments = 0;
        private Integer completedGoals = 0;
        private Integer totalGoals = 0;
        private List<SubjectStat> subjectBreakdown;
        private Map<String, Double> weeklyTrend;
        private Map<String, Double> monthlyTrend;

        public Builder totalStudyHours(Double v)        { this.totalStudyHours = v; return this; }
        public Builder totalSessions(Integer v)          { this.totalSessions = v; return this; }
        public Builder totalSubjects(Integer v)          { this.totalSubjects = v; return this; }
        public Builder completedAssignments(Integer v)  { this.completedAssignments = v; return this; }
        public Builder totalAssignments(Integer v)      { this.totalAssignments = v; return this; }
        public Builder completedGoals(Integer v)        { this.completedGoals = v; return this; }
        public Builder totalGoals(Integer v)            { this.totalGoals = v; return this; }
        public Builder subjectBreakdown(List<SubjectStat> v) { this.subjectBreakdown = v; return this; }
        public Builder weeklyTrend(Map<String, Double> v)    { this.weeklyTrend = v; return this; }
        public Builder monthlyTrend(Map<String, Double> v)   { this.monthlyTrend = v; return this; }

        public AnalyticsResponse build() { return new AnalyticsResponse(this); }
    }

    // Inner DTO for per-subject statistics
    public static class SubjectStat {
        private Long subjectId;
        private String subjectName;
        private String colorCode;
        private Double hours;

        public SubjectStat() {}

        public SubjectStat(Long subjectId, String subjectName, String colorCode, Double hours) {
            this.subjectId = subjectId;
            this.subjectName = subjectName;
            this.colorCode = colorCode;
            this.hours = hours;
        }

        public Long getSubjectId()      { return subjectId; }
        public String getSubjectName()  { return subjectName; }
        public String getColorCode()    { return colorCode; }
        public Double getHours()        { return hours; }

        public void setSubjectId(Long id)         { this.subjectId = id; }
        public void setSubjectName(String name)   { this.subjectName = name; }
        public void setColorCode(String color)    { this.colorCode = color; }
        public void setHours(Double hours)        { this.hours = hours; }
    }

    // Getters
    public Double getTotalStudyHours()          { return totalStudyHours; }
    public Integer getTotalSessions()            { return totalSessions; }
    public Integer getTotalSubjects()            { return totalSubjects; }
    public Integer getCompletedAssignments()    { return completedAssignments; }
    public Integer getTotalAssignments()        { return totalAssignments; }
    public Integer getCompletedGoals()          { return completedGoals; }
    public Integer getTotalGoals()              { return totalGoals; }
    public List<SubjectStat> getSubjectBreakdown() { return subjectBreakdown; }
    public Map<String, Double> getWeeklyTrend()  { return weeklyTrend; }
    public Map<String, Double> getMonthlyTrend() { return monthlyTrend; }
}
