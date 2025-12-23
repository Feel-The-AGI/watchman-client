# Watchman - Vision & North Star

## The Problem

Shift workers live complex lives that standard calendars can't handle:
- Rotating patterns (5 days, 5 nights, 5 off)
- Courses, certifications, diplomas with fixed itineraries
- Personal commitments that need to fit around unpredictable schedules
- Fatigue management - what's realistic after a night shift?

Google Calendar doesn't understand you. It's just a grid.

## The Solution

**Watchman is a conversational calendar that understands shift work.**

You don't fill forms. You talk to it.

```
"Jan 1 2026 is my Day 4. I work 5 days, 5 nights, then 5 off. 12-hour shifts."

"Here's my diploma calendar" [uploads PDF]

"I'm starting a 3-month surveying certification on March 15, 
Tuesdays and Thursdays 6-8pm"

"Block out February 10-20, I'm taking leave"
```

The agent understands. The calendar populates. Magic.

## Core Principles

### 1. Conversation-First
- No complex forms for initial setup
- Talk naturally, agent extracts structure
- "Propose Change" = chat with the agent
- Manual overrides exist but are secondary

### 2. Shift-Worker Native
- Understands rotating patterns, not just weekly repeats
- Knows night shifts affect next-day availability
- Tracks fatigue, suggests realistic scheduling
- Supports multiple crews, rosters, rotations

### 3. Smart Constraints
- "Don't schedule study on night shift days"
- "Max 2 hours study after day shifts"
- "Prioritize weekends off for family"
- Rules the agent enforces automatically

### 4. Visual Intelligence
- Calendar shows shift patterns at a glance
- Color-coded: Day/Night/Off/Leave/Commitments
- Year overview reveals patterns
- Click any day for deep context

### 5. No Lock-In
- Export to Google Calendar, iCal, PDF
- Your data, your control
- Works offline (PWA future)

## User Flow

### First-Time Setup (Conversational)
1. Land on app → "Tell me about your work schedule"
2. User types naturally: "I work rotating shifts, 10 on 5 off..."
3. Agent asks clarifying questions
4. Calendar populates instantly
5. "Anything else? Courses, commitments?"

### Daily Use
- Open app → See your calendar
- Talk to agent → Changes happen
- Review proposals → Approve/reject
- Settings → Manual override if needed

### Master Settings Page
All parameters the agent has learned, editable:
- Work pattern (cycle structure)
- Shift hours (12h, 8h, etc.)
- Constraints & rules
- Commitments
- Leave blocks
- Notification preferences

## Technical Architecture

### Agent (Gemini 2.5 Pro)
- Parses natural language
- Extracts structured data
- Proposes calendar mutations
- Learns user preferences

### Calendar Engine
- Generates days from cycle pattern
- Applies constraints
- Detects conflicts
- Computes availability

### Mutation Engine
- All changes are proposals
- User approves before apply
- Full undo capability
- Alternative suggestions

### Data Model
- Cycles (rotation patterns)
- Calendar Days (the grid)
- Commitments (courses, events)
- Constraints (rules)
- Mutations (change log)

## Design Philosophy

### Modern, Alive UI
- Fluid animations
- Micro-interactions
- Dark mode native
- Mobile-first responsive
- Glassmorphism + depth
- Purposeful color

### Not Basic
- Every interaction feels intentional
- Loading states are elegant
- Empty states guide action
- Errors are helpful
- Success is celebrated

## Target Users

1. **Mining/Oil & Gas Workers** - Long rotations (14/7, 21/7)
2. **Healthcare Shift Workers** - Nurses, doctors, EMTs
3. **Manufacturing** - Factory rotation schedules
4. **Security/Emergency Services** - 24/7 coverage patterns
5. **Transportation** - Pilots, drivers, rail workers
6. **Anyone with non-standard schedules**

## Success Metrics

- Time to first calendar: < 2 minutes
- User understands UI: No tutorial needed
- Agent accuracy: > 95% correct extraction
- Daily active return: Users check daily
- Word of mouth: "You need this app"

## Competitive Advantage

| Feature | Google Cal | Shift Apps | Watchman |
|---------|-----------|------------|----------|
| Rotating patterns | ❌ | ✅ | ✅ |
| Natural language | ❌ | ❌ | ✅ |
| PDF parsing | ❌ | ❌ | ✅ |
| Constraint logic | ❌ | ❌ | ✅ |
| Proposal system | ❌ | ❌ | ✅ |
| Shift-aware scheduling | ❌ | Partial | ✅ |

## Non-Goals

- We are NOT a team scheduling tool (that's When I Work)
- We are NOT a time tracker (that's Toggl)
- We are NOT a project manager (that's Asana)
- We ARE a personal smart calendar for shift workers

## The One-Liner

**"Tell Watchman your schedule. It handles the rest."**

---

*This document is the north star. Every feature, every design decision, every line of code should serve this vision.*
