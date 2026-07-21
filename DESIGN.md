# StudySync Design System Specification

## Design Philosophy

StudySync should feel calm, organized, and focused. The interface should reduce cognitive load and help students concentrate on studying rather than navigating the application.

Design Keywords:

* Clean
* Minimal
* Professional
* Productivity Focused
* Student Friendly
* Spacious
* Modern SaaS
* Accessible

Avoid:

* Heavy gradients
* Glassmorphism
* Neon colors
* Visual clutter
* Oversized icons
* Excessive animations

---

# Design Inspiration

Reference Style

* Slite
* Notion
* Linear
* GitHub
* Google Classroom

Visual Language

* Productivity SaaS
* Minimal Dashboard
* Large White Space
* Rounded Cards
* Soft Shadows
* Consistent Spacing
* Flat Design

---

# Layout System

## Desktop

Layout

Sidebar (Left)

*

Main Content

Sidebar Width

260px

Content Width

Fluid

Maximum Width

1440px

Content Padding

32px

Grid Gap

24px

---

## Tablet

Sidebar

Collapsed Icons

Content

Full Width

---

## Mobile

Top Navigation

↓

Drawer Sidebar

↓

Scrollable Content

Breakpoint

768px

---

# Color Tokens

## Background

Primary

#F8FAFC

Secondary

#F1F5F9

Surface

#FFFFFF

Hover

#EEF2FF

Border

#E2E8F0

---

## Brand

Primary

#2563EB

Primary Hover

#1D4ED8

Secondary

#22C55E

Accent

#F59E0B

---

## Status

Success

#16A34A

Warning

#F59E0B

Danger

#EF4444

Info

#0EA5E9

---

## Text

Primary

#0F172A

Secondary

#475569

Muted

#94A3B8

Disabled

#CBD5E1

White

#FFFFFF

---

# Typography

Font Family

Inter

Fallback

sans-serif

Display

40px

700

Heading 1

32px

700

Heading 2

24px

600

Heading 3

20px

600

Heading 4

18px

600

Body

16px

400

Small

14px

400

Caption

12px

400

Rules

* Use only three font weights (400, 600, 700)
* Never center long paragraphs
* Left-align all dashboard content

---

# Sidebar

Position

Fixed Left

Components

* StudySync Logo
* Dashboard
* Study Sessions
* Subjects
* Assignments
* Goals
* Analytics
* Profile
* Settings
* Logout

Style

* Rounded Navigation Items
* Active Item Uses Brand Blue
* Icons + Labels
* Smooth Hover Animation

---

# Login Page

Layout

Centered Authentication Card

Components

* Logo
* Welcome Message
* Email
* Password
* Remember Me
* Login Button
* Register Link

Card Width

420px

Border Radius

20px

Shadow

Soft

Background

White

---

# Dashboard

Header

Contains

* Greeting
* Search
* Notification Icon
* User Avatar

---

## Statistics

Four Cards

* Study Hours Today
* Current Streak
* Pending Assignments
* Weekly Progress

Card Style

* Radius 20px
* White Background
* Small Icon
* Large Value
* Small Description

---

## Subject Progress

Display

Subject Name

Progress Bar

Study Hours

Completion %

Layout

Two Columns

---

## Today's Goals

Card

Contains

* Goal Name
* Progress
* Complete Button

---

## Upcoming Assignments

Display

* Subject
* Due Date
* Priority
* Status

---

## Study Activity

Timeline

* Study Session
* Assignment Completed
* Goal Achieved

---

# Study Session Page

Form Fields

* Subject
* Date
* Start Time
* End Time
* Duration
* Notes

Primary Action

Save Session

---

# Assignment Page

Fields

* Subject
* Assignment Name
* Due Date
* Priority
* Status

Table

Responsive

Searchable

---

# Analytics

Widgets

* Weekly Study Hours
* Monthly Study Hours
* Subject Distribution
* Goal Completion
* Study Streak

Charts

* Bar Chart
* Line Chart
* Doughnut Chart

---

# Buttons

Height

48px

Radius

12px

Primary

Blue

Secondary

White

Danger

Red

Hover

5% Darker

Disabled

60% Opacity

---

# Inputs

Height

48px

Radius

12px

Border

1px Solid Border Token

Focus

Blue Border

2px Focus Ring

Placeholder

Muted Gray

---

# Cards

Radius

20px

Background

White

Border

1px Solid Border

Padding

24px

Shadow

Soft

Hover

Small Lift

---

# Icons

Style

Outlined SVG

Size

20px

Library

Lucide Icons

Usage

Dashboard

Book

Study Session

Clock

Assignments

Calendar

Goals

Target

Analytics

Chart

Profile

User

Settings

Gear

Logout

Log Out

---

# Motion

Duration

200ms

Easing

ease-in-out

Effects

* Fade In
* Hover Lift
* Button Press
* Smooth Drawer Animation
* Page Transition

---

# Responsive Rules

Desktop

≥1200px

Tablet

768–1199px

Mobile

<768px

Changes

* Sidebar becomes Drawer
* Statistics become 2×2 Grid
* Forms become Full Width
* Tables become Cards
* Navigation collapses

---

# Accessibility

* WCAG AA Contrast
* Keyboard Navigation
* Visible Focus States
* Minimum Touch Target 44px
* Semantic HTML
* ARIA Labels for Interactive Elements

---

# UX Principles

* Maximum three clicks to any feature
* Consistent navigation
* Instant feedback after actions
* Fast page loading
* Clear empty states
* Friendly error messages
* Mobile-first responsiveness

---

# Final Visual Goal

StudySync should feel like a modern productivity platform built specifically for students.

The interface should communicate:

* Focus
* Organization
* Simplicity
* Consistency
* Progress
* Motivation

Every screen should encourage students to return daily, track their learning, and stay productive without unnecessary distractions.
