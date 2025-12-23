# Watchman Overhaul Plan

## Phase 0: System Language Architecture (Priority 0 - Foundation)

### 0.1 Define Command Schema
- [ ] Create JSON schema for all system commands
- [ ] Actions: `update_cycle`, `add_commitment`, `add_leave`, `update_constraint`, `undo`, `redo`
- [ ] Each command has: action, payload, before_state, after_state
- [ ] Document in `SYSTEM_SCHEMA.md`

```json
{
  "action": "update_cycle" | "add_commitment" | "add_leave" | "update_constraint" | "undo" | "redo",
  "payload": { ... },
  "confirm": true | false  // Whether to ask user before executing
}
```

### 0.2 Master Settings Model
- [ ] Single source of truth for all user parameters
- [ ] Structure:
```json
{
  "cycle": {
    "pattern": [{"type": "day_shift", "days": 5}, ...],
    "anchor": {"date": "2026-01-01", "cycle_day": 4},
    "name": "My Rotation"
  },
  "work": {
    "shift_hours": 12,
    "shift_start": "06:00",
    "break_minutes": 60
  },
  "constraints": [
    {"id": "c1", "rule": "no_study_on_night_shift", "active": true}
  ],
  "commitments": [
    {"id": "cm1", "name": "Diploma", "type": "education", "schedule": [...]}
  ],
  "leave_blocks": [
    {"id": "l1", "start": "2026-02-10", "end": "2026-02-20", "name": "Annual Leave"}
  ]
}
```
- [ ] API: `GET/PUT /api/settings/master`
- [ ] UI: Master Settings page reads/writes this

### 0.3 Command Log (Undo Stack)
- [ ] Database table: `command_log`
- [ ] Fields: id, user_id, action, payload, before_state, after_state, timestamp, source, message_id
- [ ] API: `GET /api/commands` (history), `POST /api/commands/undo`, `POST /api/commands/redo`
- [ ] Link commands to chat messages for context

### 0.4 Gemini System Prompt
- [ ] Teach Gemini the command schema
- [ ] Provide current Master Settings as context
- [ ] Output format: JSON command or conversational response
- [ ] Handle: "undo that", "revert", "go back", "what did I change?"

```
You are Watchman, a calendar assistant for shift workers.

CURRENT STATE:
{master_settings_json}

AVAILABLE COMMANDS:
- update_cycle: Change work rotation pattern
- add_commitment: Add a course, diploma, or recurring event  
- add_leave: Block out leave dates
- update_constraint: Add/modify scheduling rules
- undo: Revert last change

When user requests a change, output:
{"action": "...", "payload": {...}, "explanation": "..."}

If clarification needed, ask naturally.
```

### 0.5 Command Executor
- [ ] Backend service that executes commands
- [ ] Validates command against schema
- [ ] **Routes through Constraint Engine before execution**
- [ ] If violations → Returns proposal with warnings (not auto-apply)
- [ ] If clean → Returns proposal for user approval
- [ ] Only after user approval → Applies change
- [ ] Logs to command_log with before/after state
- [ ] Triggers calendar regeneration

### 0.6 Constraint Engine (The Guardrail)
- [ ] Validates proposed commands against all active constraints
- [ ] Clash detection: overlapping commitments, leave conflicts
- [ ] Fatigue rules: no heavy scheduling after night shifts
- [ ] Overload detection: too many commitments on one day
- [ ] Returns: `{valid: bool, violations: [], warnings: [], alternatives: []}`

```
Command Flow:

Gemini → JSON Command → Constraint Engine →
  ├─ Valid + no warnings → Proposal (user approves) → Execute
  ├─ Valid + warnings → Proposal with warnings (user decides)
  └─ Invalid (hard constraint) → Proposal blocked + alternatives shown
```

This is the GUARDRAIL. The agent cannot hallucinate changes through.
User always has final say.

### 0.7 Chat History
- [ ] Database table: `chat_messages`
- [ ] Fields: id, user_id, role (user/assistant), content, command_id (nullable), timestamp
- [ ] API: `GET /api/chat/history`, `POST /api/chat/message`
- [ ] Provides context for multi-turn conversations

---

## Phase 1: Conversational Core (Priority 1)

### 1.1 Agent Chat Interface
- [ ] Replace "Propose Change" modal with full chat interface
- [ ] Persistent chat sidebar/panel on dashboard
- [ ] Message history with context
- [ ] Typing indicators, streaming responses
- [ ] Quick action chips ("Add leave", "Change shift", etc.)

### 1.2 Conversational Onboarding
- [ ] New user lands on chat-first setup
- [ ] "Tell me about your work schedule" prompt
- [ ] Agent asks clarifying questions
- [ ] Real-time calendar preview as user talks
- [ ] No forms until user is done talking

### 1.3 Agent Intelligence
- [ ] Enhance Gemini prompts for shift work domain
- [ ] Multi-turn conversation support
- [ ] Remember context within session
- [ ] Extract: cycles, constraints, commitments, leave
- [ ] Confirm before applying changes

---

## Phase 2: Master Settings (Priority 1)

### 2.1 Unified Settings Dashboard
- [ ] All agent-learned parameters in one view
- [ ] Sections: Work Pattern, Schedule, Constraints, Commitments
- [ ] Everything editable inline
- [ ] Changes trigger calendar regeneration

### 2.2 Work Parameters
- [ ] Shift duration (8h, 10h, 12h, custom)
- [ ] Work hours (start/end times)
- [ ] Break patterns
- [ ] Crew/roster name

### 2.3 Constraints Manager
- [ ] Visual constraint builder
- [ ] Active/inactive toggle
- [ ] Weight/priority sliders
- [ ] Common presets ("No study on night shifts")

### 2.4 Commitments List
- [ ] All extracted commitments
- [ ] Status: Active, Completed, Paused
- [ ] Edit schedule, duration, constraints
- [ ] Link to source (PDF, chat message)

---

## Phase 3: Modern UI Overhaul (Priority 1)

### 3.1 Design System
- [ ] Research 2024-2026 design trends
- [ ] Bento grid layouts
- [ ] Glassmorphism cards with blur
- [ ] Gradient accents
- [ ] Smooth 60fps animations
- [ ] Micro-interactions on every action

### 3.2 Calendar Redesign
- [ ] Richer day cells with more info
- [ ] Smooth month transitions
- [ ] Pinch-to-zoom on mobile
- [ ] Drag-to-select date ranges
- [ ] Hover previews

### 3.3 Dashboard Layout
- [ ] Bento grid with draggable widgets
- [ ] Calendar takes center stage
- [ ] Chat panel (collapsible)
- [ ] Quick stats cards
- [ ] Upcoming commitments timeline

### 3.4 Empty States
- [ ] Illustrated, friendly empty states
- [ ] Clear CTAs
- [ ] Animated illustrations (Lottie)

### 3.5 Loading States
- [ ] Skeleton loaders
- [ ] Shimmer effects
- [ ] Progressive content reveal

---

## Phase 4: Core Features Polish (Priority 2)

### 4.1 Calendar Improvements
- [ ] Multi-year support (navigate any year)
- [ ] Week view option
- [ ] Agenda/list view
- [ ] Today button
- [ ] Jump to date

### 4.2 PDF Parsing Enhancement
- [ ] Better extraction accuracy
- [ ] Preview parsed results before apply
- [ ] Support more formats (images, screenshots)
- [ ] Drag-and-drop upload

### 4.3 Notifications
- [ ] Daily schedule reminder
- [ ] Commitment reminders
- [ ] Shift change alerts
- [ ] Email + push (future: WhatsApp)

### 4.4 Export
- [ ] Google Calendar sync
- [ ] iCal download
- [ ] PDF calendar export
- [ ] Share link for specific ranges

---

## Phase 5: Generalization (Priority 2)

### 5.1 Remove Hardcoding
- [ ] Audit all placeholder text
- [ ] Generic examples, not personal
- [ ] Localization-ready strings
- [ ] Timezone support

### 5.2 Industry Presets
- [ ] Mining/Resources
- [ ] Healthcare
- [ ] Security
- [ ] Transportation
- [ ] Custom

### 5.3 Onboarding Templates
- [ ] "I work rotating shifts"
- [ ] "I have a regular 9-5 but with courses"
- [ ] "I'm a healthcare worker"
- [ ] "Custom - let me explain"

---

## Phase 6: Performance & Polish (Priority 3)

### 6.1 Performance
- [ ] Lazy load calendar months
- [ ] Virtual scrolling for year view
- [ ] Optimistic UI updates
- [ ] Service worker caching

### 6.2 Mobile Experience
- [ ] Touch gestures
- [ ] Bottom sheet modals
- [ ] Swipe navigation
- [ ] PWA manifest

### 6.3 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Reduced motion option

---

## Immediate Next Steps

1. **Phase 1.1** - Build chat interface (replace proposals modal)
2. **Phase 3.1** - Design system refresh (colors, spacing, animations)
3. **Phase 2.1** - Master settings page
4. **Phase 1.2** - Conversational onboarding
5. **Phase 5.1** - Remove hardcoded/personal content

---

## Files to Modify

### Frontend (Major Changes)
- `src/app/dashboard/page.tsx` - Add chat panel, bento layout
- `src/app/dashboard/proposals/page.tsx` - Convert to chat interface
- `src/app/dashboard/settings/page.tsx` - Master settings overhaul
- `src/app/onboarding/page.tsx` - Conversational setup
- `src/components/calendar/` - Enhanced calendar components
- `src/components/chat/` - New chat components
- `src/components/ui/` - Design system refresh
- `tailwind.config.ts` - Updated theme, animations

### Backend (Minor Changes)
- `app/routes/proposals.py` - Chat conversation endpoint
- `app/engines/proposal_service.py` - Multi-turn conversation
- `app/routes/settings.py` - Unified settings endpoint

---

## Design References

Research these trends:
- Bento grid layouts (Apple style)
- Glassmorphism 2.0
- Gradient mesh backgrounds
- Smooth spring animations
- Variable fonts with weight transitions
- 3D subtle depth effects
- Dark mode with vibrant accents

---

*This plan will be executed incrementally. Each phase builds on the previous.*
