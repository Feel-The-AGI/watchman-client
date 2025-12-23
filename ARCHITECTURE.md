# Watchman System Architecture

## Overview

Watchman is a conversational calendar for shift workers. Users speak naturally, an AI agent (Gemini 2.5 Pro) translates to structured commands, the system validates against constraints, and only approved changes modify the calendar.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Chat Panel    │  │    Calendar     │  │     Master Settings         │  │
│  │  (talk to agent)│  │   (visualize)   │  │   (manual overrides)        │  │
│  └────────┬────────┘  └────────▲────────┘  └──────────────▲──────────────┘  │
└───────────┼────────────────────┼──────────────────────────┼─────────────────┘
            │                    │                          │
            ▼                    │                          │
┌───────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         CHAT SERVICE                                     │  │
│  │  • Receives user message                                                 │  │
│  │  • Loads Master Settings as context                                      │  │
│  │  • Loads chat history for multi-turn                                     │  │
│  │  • Calls Gemini 2.5 Pro                                                  │  │
│  │  • Receives JSON command or conversational response                      │  │
│  └─────────────────────────────────┬───────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      COMMAND EXECUTOR                                    │  │
│  │  • Validates command against schema                                      │  │
│  │  • Routes to Constraint Engine                                           │  │
│  │  • Creates Proposal record                                               │  │
│  │  • Waits for user approval                                               │  │
│  │  • On approval: applies change, logs to command_log                      │  │
│  └─────────────────────────────────┬───────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      CONSTRAINT ENGINE (GUARDRAIL)                       │  │
│  │  • Loads all active constraints                                          │  │
│  │  • Validates proposed change against each                                │  │
│  │  • Detects: clashes, fatigue, overload, conflicts                        │  │
│  │  • Returns: {valid, violations[], warnings[], alternatives[]}            │  │
│  └─────────────────────────────────┬───────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      CALENDAR ENGINE                                     │  │
│  │  • Reads Master Settings (cycle, constraints, commitments, leave)        │  │
│  │  • Generates calendar_days for year                                      │  │
│  │  • Applies cycle pattern from anchor date                                │  │
│  │  • Overlays commitments on appropriate days                              │  │
│  │  • Marks leave blocks                                                    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                      │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │   │
│  │  │   users    │ │  master_   │ │  command_  │ │   chat_    │           │   │
│  │  │            │ │  settings  │ │    log     │ │  messages  │           │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │   │
│  │  │ calendar_  │ │ proposals  │ │constraints │ │commitments │           │   │
│  │  │   days     │ │            │ │            │ │            │           │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. System Language (Command Schema)

Every action in Watchman is a structured JSON command. The AI agent outputs these, the system executes them.

### 1.1 Command Structure

```json
{
  "action": "string",           // The action type
  "payload": {},                // Action-specific data
  "explanation": "string",      // Human-readable explanation for UI
  "confirm": true               // Whether to show proposal first
}
```

### 1.2 Available Actions

#### `update_cycle` - Modify work rotation pattern
```json
{
  "action": "update_cycle",
  "payload": {
    "name": "My Rotation",
    "pattern": [
      {"type": "day_shift", "days": 5},
      {"type": "night_shift", "days": 5},
      {"type": "off", "days": 5}
    ],
    "anchor": {
      "date": "2026-01-01",
      "cycle_day": 4
    },
    "shift_hours": 12,
    "shift_start": "06:00",
    "break_minutes": 60
  },
  "explanation": "Setting up 5-5-5 rotation with 12-hour shifts",
  "confirm": true
}
```

#### `add_commitment` - Add course, diploma, recurring event
```json
{
  "action": "add_commitment",
  "payload": {
    "name": "Survey & Mapping Diploma",
    "type": "education",
    "schedule": {
      "type": "recurring",
      "days_of_week": ["tuesday", "thursday"],
      "time_start": "18:00",
      "time_end": "20:00",
      "start_date": "2026-03-15",
      "end_date": "2027-03-15"
    },
    "constraints": {
      "avoid_night_shifts": true,
      "max_hours_after_day_shift": 2
    },
    "source": "chat",
    "source_text": "I'm starting a diploma in Survey & Mapping..."
  },
  "explanation": "Adding diploma classes on Tue/Thu evenings for 1 year",
  "confirm": true
}
```

#### `add_leave` - Block out leave dates
```json
{
  "action": "add_leave",
  "payload": {
    "name": "Annual Leave",
    "start_date": "2026-02-10",
    "end_date": "2026-02-20",
    "type": "annual",
    "notes": "Family vacation"
  },
  "explanation": "Blocking Feb 10-20 for annual leave",
  "confirm": true
}
```

#### `update_constraint` - Add/modify scheduling rules
```json
{
  "action": "update_constraint",
  "payload": {
    "id": "c_new_or_existing",
    "rule": "no_study_on_night_shift",
    "type": "hard",
    "description": "Don't schedule study on night shift days",
    "active": true
  },
  "explanation": "Adding rule to prevent study on night shifts",
  "confirm": true
}
```

#### `remove_commitment` - Delete a commitment
```json
{
  "action": "remove_commitment",
  "payload": {
    "id": "commitment_id"
  },
  "explanation": "Removing the short course",
  "confirm": true
}
```

#### `undo` - Revert last change
```json
{
  "action": "undo",
  "payload": {
    "command_id": "cmd_123"  // Optional, defaults to last
  },
  "explanation": "Reverting the last change",
  "confirm": false
}
```

#### `redo` - Reapply undone change
```json
{
  "action": "redo",
  "payload": {
    "command_id": "cmd_123"
  },
  "explanation": "Reapplying the change",
  "confirm": false
}
```

---

## 2. Master Settings (Source of Truth)

All user parameters live in a single JSON document. Gemini reads this for context, commands write to it.

### 2.1 Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "version": 1,
  "updated_at": "2026-01-01T10:00:00Z",
  
  "cycle": {
    "id": "uuid",
    "name": "Mining Rotation",
    "pattern": [
      {"type": "day_shift", "days": 5, "label": "Day"},
      {"type": "night_shift", "days": 5, "label": "Night"},
      {"type": "off", "days": 5, "label": "Off"}
    ],
    "total_days": 15,
    "anchor": {
      "date": "2026-01-01",
      "cycle_day": 4
    }
  },
  
  "work": {
    "shift_hours": 12,
    "shift_start": "06:00",
    "shift_end": "18:00",
    "break_minutes": 60,
    "overtime_allowed": false,
    "crew": "Crew A"
  },
  
  "constraints": [
    {
      "id": "c1",
      "rule": "no_study_on_night_shift",
      "type": "hard",
      "description": "No study sessions on night shift days",
      "active": true,
      "created_by": "agent"
    },
    {
      "id": "c2",
      "rule": "max_hours_after_day_shift",
      "type": "soft",
      "value": 2,
      "description": "Max 2 hours commitments after day shifts",
      "active": true,
      "created_by": "user"
    },
    {
      "id": "c3",
      "rule": "rest_after_night_shift",
      "type": "hard",
      "value": 8,
      "description": "8 hours rest required after night shift",
      "active": true,
      "created_by": "system"
    }
  ],
  
  "commitments": [
    {
      "id": "cm1",
      "name": "Survey & Mapping Diploma",
      "type": "education",
      "status": "active",
      "schedule": {
        "type": "recurring",
        "days_of_week": ["tuesday", "thursday"],
        "time_start": "18:00",
        "time_end": "20:00",
        "duration_hours": 2,
        "start_date": "2026-03-15",
        "end_date": "2027-03-15"
      },
      "source": "pdf",
      "source_file": "diploma_schedule.pdf",
      "color": "#8B5CF6",
      "icon": "graduation-cap"
    },
    {
      "id": "cm2",
      "name": "Safety Certification",
      "type": "education",
      "status": "active",
      "schedule": {
        "type": "recurring",
        "days_of_week": ["saturday"],
        "time_start": "09:00",
        "time_end": "12:00",
        "duration_hours": 3,
        "start_date": "2026-04-01",
        "end_date": "2026-06-30"
      },
      "source": "chat",
      "color": "#F59E0B",
      "icon": "shield-check"
    }
  ],
  
  "leave_blocks": [
    {
      "id": "l1",
      "name": "Annual Leave",
      "type": "annual",
      "start_date": "2026-02-10",
      "end_date": "2026-02-20",
      "status": "approved",
      "notes": "Family vacation",
      "affects_cycle": true
    }
  ],
  
  "preferences": {
    "timezone": "Africa/Accra",
    "week_starts_on": "monday",
    "notification_email": true,
    "notification_push": true,
    "theme": "dark"
  }
}
```

### 2.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/master` | Get full master settings |
| PUT | `/api/settings/master` | Update entire master settings |
| PATCH | `/api/settings/master/{section}` | Update specific section |

---

## 3. Command Log (Undo Stack)

Every executed command is logged with before/after state for undo capability.

### 3.1 Structure

```json
{
  "id": "cmd_abc123",
  "user_id": "uuid",
  "action": "add_commitment",
  "payload": { ... },
  "before_state": {
    "commitments": [ ... ]  // State before change
  },
  "after_state": {
    "commitments": [ ... ]  // State after change
  },
  "timestamp": "2026-01-01T10:00:00Z",
  "source": "chat",
  "message_id": "msg_xyz789",
  "status": "applied",  // applied, undone, redone
  "explanation": "Added diploma classes"
}
```

### 3.2 Undo/Redo Logic

```
UNDO:
1. Find command in log
2. Restore before_state to Master Settings
3. Mark command as "undone"
4. Regenerate calendar

REDO:
1. Find undone command
2. Restore after_state to Master Settings
3. Mark command as "redone"
4. Regenerate calendar
```

### 3.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commands` | List command history |
| GET | `/api/commands/{id}` | Get specific command |
| POST | `/api/commands/undo` | Undo last (or specific) command |
| POST | `/api/commands/redo` | Redo last undone command |

---

## 4. Chat Service

Handles conversation with user and coordinates with Gemini.

### 4.1 Message Flow

```
1. User sends message via chat UI
2. Backend receives POST /api/chat/message
3. Load user's Master Settings
4. Load recent chat history (last N messages)
5. Build Gemini prompt with context
6. Call Gemini 2.5 Pro
7. Parse response:
   - If JSON command → Route to Command Executor
   - If conversational → Return as assistant message
8. Store message in chat_messages
9. Return response to UI
```

### 4.2 Gemini System Prompt

```
You are Watchman, a calendar assistant for shift workers.

CURRENT USER STATE:
{master_settings_json}

AVAILABLE COMMANDS:
- update_cycle: Change work rotation pattern
- add_commitment: Add course, diploma, recurring event
- add_leave: Block out leave dates
- update_constraint: Add/modify scheduling rules
- remove_commitment: Remove a commitment
- undo: Revert last change
- redo: Reapply undone change

COMMAND FORMAT:
When user requests a change, output valid JSON:
{"action": "...", "payload": {...}, "explanation": "...", "confirm": true}

RULES:
1. Always output valid JSON for actions
2. Set confirm: true for destructive/major changes
3. If clarification needed, ask naturally (no JSON)
4. Understand "undo that", "revert", "go back"
5. Can explain what you're about to do before doing it
6. Reference specific dates/days when relevant

CONSTRAINTS THE USER HAS:
{constraints_summary}

Be helpful, concise, and shift-work aware.
```

### 4.3 Chat Message Structure

```json
{
  "id": "msg_abc123",
  "user_id": "uuid",
  "role": "user" | "assistant",
  "content": "Add my diploma classes on Tuesday evenings",
  "command_id": null,  // Links to command if this triggered one
  "timestamp": "2026-01-01T10:00:00Z",
  "metadata": {
    "tokens_used": 150,
    "model": "gemini-2.5-pro"
  }
}
```

### 4.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/history` | Get chat history |
| POST | `/api/chat/message` | Send message, get response |
| DELETE | `/api/chat/history` | Clear chat history |

---

## 5. Command Executor

Validates and executes commands from the agent.

### 5.1 Execution Flow

```
1. Receive JSON command from Chat Service
2. Validate against command schema
3. Route to Constraint Engine for validation
4. If violations:
   - Create Proposal with warnings
   - Return to user for decision
5. If clean:
   - Create Proposal for confirmation
   - Wait for user approval
6. On approval:
   - Save before_state
   - Apply change to Master Settings
   - Save after_state
   - Log to command_log
   - Trigger Calendar Engine regeneration
   - Return success
```

### 5.2 Proposal Structure

```json
{
  "id": "prop_abc123",
  "user_id": "uuid",
  "command": { ... },  // The original command
  "status": "pending" | "approved" | "rejected",
  "validation": {
    "valid": true,
    "violations": [],
    "warnings": [
      {
        "type": "clash",
        "message": "Tuesday Jan 7 is a night shift",
        "affected_dates": ["2026-01-07", "2026-01-14"]
      }
    ],
    "alternatives": [
      {
        "description": "Skip night shift days",
        "modified_payload": { ... }
      }
    ]
  },
  "created_at": "2026-01-01T10:00:00Z",
  "reviewed_at": null
}
```

### 5.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposals` | List pending proposals |
| GET | `/api/proposals/{id}` | Get proposal details |
| POST | `/api/proposals/{id}/approve` | Approve and execute |
| POST | `/api/proposals/{id}/reject` | Reject proposal |
| POST | `/api/proposals/{id}/modify` | Approve with modifications |

---

## 6. Constraint Engine (The Guardrail)

Validates proposed changes against all active constraints. This is the GUARDRAIL that prevents hallucinations from corrupting the calendar.

### 6.1 Validation Flow

```
1. Receive proposed command
2. Load all active constraints from Master Settings
3. For each constraint:
   - Evaluate against proposed change
   - Collect violations (hard) and warnings (soft)
4. Check for clashes:
   - Overlapping commitments
   - Leave conflicts
   - Overload (too many on one day)
5. Apply fatigue rules:
   - Rest requirements after night shifts
   - Max hours per day
6. Generate alternatives if violations found
7. Return validation result
```

### 6.2 Constraint Types

| Type | Behavior | Example |
|------|----------|---------|
| `hard` | Blocks action | "No study on night shift days" |
| `soft` | Warns but allows | "Prefer study on off days" |
| `system` | Built-in, always active | "Max 24 hours per day" |

### 6.3 Built-in Constraints

```json
[
  {
    "rule": "no_overlap",
    "type": "system",
    "description": "Commitments cannot overlap in time"
  },
  {
    "rule": "max_daily_hours",
    "type": "system",
    "value": 24,
    "description": "Cannot exceed 24 hours in a day"
  },
  {
    "rule": "leave_blocks_work",
    "type": "system",
    "description": "Leave days override work schedule"
  }
]
```

### 6.4 Validation Result Structure

```json
{
  "valid": false,
  "violations": [
    {
      "constraint_id": "c1",
      "rule": "no_study_on_night_shift",
      "type": "hard",
      "message": "Cannot schedule study on night shift days",
      "affected_dates": ["2026-01-07", "2026-01-14", "2026-01-21"]
    }
  ],
  "warnings": [
    {
      "constraint_id": "c2",
      "rule": "max_hours_after_day_shift",
      "type": "soft",
      "message": "This adds 2 hours after day shifts",
      "affected_dates": ["2026-01-06", "2026-01-13"]
    }
  ],
  "alternatives": [
    {
      "id": "alt_1",
      "description": "Skip night shift days (removes 3 sessions)",
      "modified_payload": { ... },
      "impact": "15 sessions instead of 18"
    },
    {
      "id": "alt_2", 
      "description": "Move to off days only",
      "modified_payload": { ... },
      "impact": "Classes on off days"
    }
  ]
}
```

---

## 7. Calendar Engine

Generates the visual calendar from Master Settings.

### 7.1 Generation Flow

```
1. Load Master Settings
2. Get cycle pattern and anchor date
3. For each day in range:
   a. Calculate cycle_day from anchor
   b. Determine work_type (day/night/off)
   c. Check if in leave_block → mark as leave
   d. Find applicable commitments
   e. Compute available_hours based on work_type
   f. Check for overload
4. Return array of calendar_days
5. Store in database
```

### 7.2 Calendar Day Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "2026-01-07",
  "cycle_id": "uuid",
  "cycle_day": 7,
  "work_type": "night_shift",
  "is_leave": false,
  "state_json": {
    "available_hours": 2,
    "used_hours": 0,
    "commitments": [],
    "is_overloaded": false,
    "tags": ["night"]
  }
}
```

### 7.3 Work Type → Available Hours

| Work Type | Available Hours | Notes |
|-----------|-----------------|-------|
| `day_shift` | 4 | Evening hours after work |
| `night_shift` | 2 | Minimal time, need rest |
| `off` | 12 | Most time available |
| `leave` | 16 | Full day available |

### 7.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/year/{year}` | Get full year |
| GET | `/api/calendar/month/{year}/{month}` | Get specific month |
| GET | `/api/calendar/day/{date}` | Get specific day details |
| POST | `/api/calendar/generate` | Regenerate calendar |

---

## 8. Database Schema

### 8.1 Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  tier user_tier DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Master Settings (one per user)
CREATE TABLE master_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id),
  settings JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Command Log (undo stack)
CREATE TABLE command_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  before_state JSONB,
  after_state JSONB,
  status command_status DEFAULT 'applied',
  message_id UUID,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role message_role NOT NULL,
  content TEXT NOT NULL,
  command_id UUID REFERENCES command_log(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Proposals (pending approvals)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  command JSONB NOT NULL,
  validation JSONB NOT NULL,
  status proposal_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Calendar Days (generated output)
CREATE TABLE calendar_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  cycle_day INTEGER,
  work_type work_type NOT NULL,
  state_json JSONB DEFAULT '{}',
  UNIQUE(user_id, date)
);

-- Enums
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'admin');
CREATE TYPE command_status AS ENUM ('applied', 'undone', 'redone');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE work_type AS ENUM ('day_shift', 'night_shift', 'off');
```

---

## 9. Frontend Architecture

### 9.1 Page Structure

```
/                       → Landing page
/login                  → Auth (Supabase OAuth)
/onboarding             → First-time conversational setup
/dashboard              → Main calendar + chat
/dashboard/settings     → Master Settings editor
/dashboard/stats        → Analytics & insights
```

### 9.2 Key Components

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Calendar + Chat layout
│   │   ├── settings/page.tsx  # Master Settings
│   │   └── stats/page.tsx     # Analytics
│   └── onboarding/page.tsx    # Conversational setup
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx      # Chat interface
│   │   ├── Message.tsx        # Single message
│   │   └── ProposalCard.tsx   # Pending proposal
│   ├── calendar/
│   │   ├── CalendarGrid.tsx   # Month view
│   │   ├── YearOverview.tsx   # Year view
│   │   └── DayInspector.tsx   # Day details
│   └── settings/
│       ├── CycleEditor.tsx    # Edit rotation
│       ├── ConstraintList.tsx # Manage rules
│       └── CommitmentList.tsx # Manage commitments
└── lib/
    ├── api.ts                 # API client
    └── supabase.ts            # Supabase client
```

### 9.3 State Management

- **Server State**: React Query for API data
- **UI State**: React useState/useContext
- **Auth State**: Supabase Auth hooks

---

## 10. API Summary

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Chat** | `/api/chat/message` | POST | Send message, get response |
| | `/api/chat/history` | GET | Get chat history |
| **Settings** | `/api/settings/master` | GET | Get master settings |
| | `/api/settings/master` | PUT | Update master settings |
| **Commands** | `/api/commands` | GET | List command history |
| | `/api/commands/undo` | POST | Undo last command |
| | `/api/commands/redo` | POST | Redo command |
| **Proposals** | `/api/proposals` | GET | List pending proposals |
| | `/api/proposals/{id}/approve` | POST | Approve proposal |
| | `/api/proposals/{id}/reject` | POST | Reject proposal |
| **Calendar** | `/api/calendar/year/{year}` | GET | Get year calendar |
| | `/api/calendar/generate` | POST | Regenerate calendar |

---

## 11. Security

- **Authentication**: Supabase Auth (OAuth, email)
- **Authorization**: Row Level Security (RLS) on all tables
- **API Auth**: JWT validation middleware
- **Rate Limiting**: Per-user request limits
- **Data Isolation**: user_id on all queries

---

## 12. Key Principles

1. **Conversation-first**: Talk naturally, system structures
2. **Agent is not free-range**: Constraint Engine validates all changes
3. **User decides**: Proposals require approval
4. **Undo everything**: Full command history with revert
5. **Single source of truth**: Master Settings owns all state
6. **Calendar is derived**: Generated from Master Settings

---

*This architecture document is the technical foundation. All implementation must follow this structure.*
