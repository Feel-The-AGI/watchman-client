import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  appliedConfirmation,
  chatInputLocked,
  chatMessageText,
  chatScrollBehavior,
  chatScrollTop,
  chatTextParts,
  displayedChatParts,
  isInternalChatMessage,
  mergeChatHistory,
  messagesAfterSend,
  blankDaysProposalFate,
  blankDaysProposalIdsToDecline,
  newestVisibleProposal,
  proposalAppliedText,
  proposalCardText,
  proposalModelNote,
  stalePendingCards,
  userAskedToClearDays,
  REVIEW_FAILURE_MESSAGE,
  sanitizeChatDisplay,
} from './chat-display.ts'

describe('chat display', () => {
  it('hides onboarding system prompts and parser JSON', () => {
    assert.equal(isInternalChatMessage({
      role: 'user',
      content: 'The user is describing their work shift rotation pattern: "14 on 14 off". Respond in this EXACT JSON format.',
    }), true)
    assert.equal(isInternalChatMessage({
      role: 'assistant',
      content: '{"understood": true, "pattern": [{"label": "work_day", "duration": 14}], "message": "ok"}',
    }), true)
    assert.equal(isInternalChatMessage({ role: 'system', content: 'internal' }), true)
    assert.equal(isInternalChatMessage({ role: 'user', content: '14 on, 14 off' }), false)
  })

  it('never renders raw objects or JSON dicts', () => {
    assert.equal(chatMessageText({ detail: { code: 12 } }), 'Something went wrong. Please try again.')
    assert.equal(chatMessageText('{"error": {"code": "paystack"}}'), 'Something went wrong. Please try again.')
    assert.equal(chatMessageText({ message: 'Try a shorter request.' }), 'Try a shorter request.')
    assert.equal(chatMessageText('[object Object]'), 'Something went wrong. Please try again.')
    assert.equal(chatMessageText('Your rotation is saved.'), 'Your rotation is saved.')
  })

  it('reads string, structured, and missing chat content as text', () => {
    assert.equal(chatMessageText('Book a haircut'), 'Book a haircut')
    assert.equal(chatMessageText({ message: 'Added the night shift.' }), 'Added the night shift.')
    assert.equal(chatMessageText(undefined), null)
    assert.equal(chatMessageText(null), null)
    assert.deepEqual(displayedChatParts('user', { message: 'Added the night shift.' }), [
      { kind: 'text', text: 'Added the night shift.' },
    ])
    assert.deepEqual(displayedChatParts('user', null), [])
    const proposal = {
      id: 'p-blank',
      message_id: 'u-clear',
      command: { action: 'override_days', payload: { work_type: 'blank' } },
    }
    assert.equal(
      blankDaysProposalFate(
        proposal,
        [{ id: 'u-clear', role: 'user', content: { message: 'please clear those days' } }],
        true,
      ),
      'show',
    )
  })

  it('uses command.explanation and hides raw tool names', () => {
    const proposal = {
      command: { explanation: 'Add a dentist visit on Tuesday.' },
    }
    assert.equal(
      proposalCardText(proposal, 'Executing add_commitment'),
      'Add a dentist visit on Tuesday.',
    )
    assert.equal(
      proposalAppliedText(proposal),
      'Done! Add a dentist visit on Tuesday.',
    )
    assert.equal(proposalCardText({ command: { explanation: 'Executing add_commitment' } }, 'Executing add_commitment'), 'Review this proposed change.')
    assert.equal(proposalAppliedText({ command: { explanation: 'add_commitment' } }), 'Done! Changes applied successfully.')
    assert.equal(proposalCardText(null, 'Executing add_commitment').includes('add_commitment'), false)
    assert.equal(proposalAppliedText(null).includes('Executing'), false)
  })

  it('unlocks the chat input after a failed review', () => {
    const afterFailure = { pendingProposal: null, isReviewing: false }
    assert.equal(chatInputLocked(afterFailure.pendingProposal, afterFailure.isReviewing), false)
    assert.equal(chatInputLocked({ id: 'proposal-1' }, false), false)
    assert.equal(chatInputLocked(null, true), true)
    assert.equal(
      REVIEW_FAILURE_MESSAGE,
      "That didn't go through. You can try again or send another message.",
    )
  })

  it('shows the user message once when a proposal card arrives', () => {
    const older = { id: 'older', role: 'assistant', content: 'Hello', created_at: '' }
    const optimistic = { id: 'temp-1', role: 'user', content: 'Book a dentist appointment', created_at: '' }
    const saved = { id: 'srv-1', role: 'user', content: 'Book a dentist appointment', created_at: '' }
    const card = {
      id: 'asst-1',
      role: 'assistant',
      content: 'Add Dentist appointment on Tue 27 Oct, 10–11am',
      created_at: '',
      isProposal: true,
      proposal: { id: 'p1' },
    }
    const shown = messagesAfterSend([older, optimistic], 'temp-1', saved, card)
    const userMessages = shown.filter((message) => message.role === 'user')
    assert.equal(userMessages.length, 1)
    assert.equal(userMessages[0].id, 'srv-1')
    assert.equal(userMessages[0].content, 'Book a dentist appointment')
    assert.equal(shown.filter((message) => message.proposal).length, 1)
    assert.equal(proposalAppliedText(card.proposal), 'Done! Changes applied successfully.')

    const echoed = [older, optimistic, saved, card]
    const merged = mergeChatHistory(echoed, [older, saved, card])
    assert.equal(merged.filter((message) => message.role === 'user').length, 1)
    assert.equal(merged.filter((message) => message.role === 'user')[0].id, 'srv-1')
  })

  it('keeps a new yes when an older saved yes has no echo in the reply', () => {
    const earlier = { id: 'srv-old', role: 'user', content: 'yes', created_at: '' }
    const optimistic = { id: 'temp-2', role: 'user', content: 'yes', created_at: '' }
    const reply = { id: 'asst-2', role: 'assistant', content: 'Noted.', created_at: '' }
    const shown = messagesAfterSend([earlier, optimistic], 'temp-2', null, reply)
    const yeses = shown.filter((message) => message.role === 'user' && message.content === 'yes')
    assert.equal(yeses.length, 2)
    assert.equal(yeses[1].id, 'temp-2')

    const merged = mergeChatHistory(
      [earlier, optimistic],
      [earlier, { id: 'srv-other', role: 'user', content: 'book a dentist', created_at: '' }],
    )
    assert.equal(merged.filter((message) => message.id === 'temp-2').length, 1)
  })

  it('translates legacy tool text and keeps markdown as text parts', () => {
    assert.equal(sanitizeChatDisplay('Executing add_commitment'), 'Adding a commitment.')
    assert.equal(sanitizeChatDisplay('Executing add_leave'), 'Adding leave.')
    const parts = chatTextParts('See **this** <script>alert(1)</script> and `code`')
    assert.equal(parts.some((part) => part.kind === 'text' && part.text.includes('<script>alert(1)</script>')), true)
    assert.deepEqual(parts.filter((part) => part.kind === 'bold'), [{ kind: 'bold', text: 'this' }])
    assert.deepEqual(parts.filter((part) => part.kind === 'code'), [{ kind: 'code', text: 'code' }])
    const lines = chatTextParts('First line\n*second*')
    assert.equal(lines[0].kind, 'text')
    assert.equal(lines[0].text.includes('\n'), true)
    assert.equal(lines[1].kind, 'em')
  })

  it('confirms an applied commitment in the past tense from the payload date', () => {
    const proposal = {
      command: {
        action: 'add_commitment',
        explanation: "I'll add the haircut on Thursday.",
        payload: {
          name: 'Haircut',
          type: 'personal',
          start_date: '2026-11-05',
          time_start: '16:00',
          time_end: '17:00',
        },
      },
    }
    const line = appliedConfirmation(proposal)
    assert.equal(line, 'Added: Haircut on Thu 5 Nov, 16:00-17:00.')
    assert.equal(line?.includes("I'll"), false)
    assert.equal(appliedConfirmation({ command: { explanation: "I'll add the haircut next week." } }), null)
  })

  it('names a multi-day leave by its start and end dates', () => {
    assert.equal(appliedConfirmation({
      command: {
        action: 'add_leave',
        payload: { name: 'Leave', start_date: '2026-12-20', end_date: '2026-12-27' },
      },
    }), 'Added: Leave, Sun 20 – Sun 27 Dec')
  })

  it('leaves a removed commitment on the older Done line', () => {
    assert.equal(appliedConfirmation({
      command: {
        action: 'remove_commitment',
        explanation: "I'll remove the dentist.",
        payload: { name: 'Dentist', start_date: '2026-10-27' },
      },
    }), null)
  })

  it('renders a user message exactly as typed', () => {
    const typed = 'Meeting with <John> at 2*3*4'
    assert.deepEqual(displayedChatParts('user', typed), [{ kind: 'text', text: typed }])
    assert.deepEqual(displayedChatParts('user', 'add_commitment'), [{ kind: 'text', text: 'add_commitment' }])
    const json = '{"message":"hi"}'
    assert.deepEqual(displayedChatParts('user', json), [{ kind: 'text', text: json }])
  })

  it('jumps to the newest message before later messages animate', () => {
    assert.equal(chatScrollTop(900, 420), 480)
    assert.equal(chatScrollTop(100, 420), 0)
    assert.equal(chatScrollBehavior(false), 'auto')
    assert.equal(chatScrollBehavior(true), 'smooth')
  })

  it('does not treat unclear or clearly as a request to clear days', () => {
    assert.equal(userAskedToClearDays('the schedule is unclear'), false)
    assert.equal(userAskedToClearDays('clearly a day shift'), false)
    assert.equal(userAskedToClearDays('please clear the days before Oct 22'), true)
    assert.equal(userAskedToClearDays('clearing the days before Jan'), true)
    assert.equal(userAskedToClearDays('blanked days'), true)
    assert.equal(userAskedToClearDays('mark them blank'), true)
    assert.equal(userAskedToClearDays('leave those days untracked'), true)
  })

  it('shows the newer card when the oldest blank-days proposal is hidden', () => {
    const hidden = {
      id: 'old',
      created_at: '2026-10-22T01:00:00Z',
      message_id: 'u-setup',
      command: {
        action: 'override_days',
        explanation: 'Clear every day before the anchor',
        payload: { work_type: 'blank', start_date: '2026-01-01', end_date: '2026-10-21', description: 'incident body' },
      },
    }
    const newer = {
      id: 'new',
      created_at: '2026-10-22T02:00:00Z',
      message_id: 'u-hair',
      command: {
        action: 'add_commitment',
        explanation: 'Add Haircut on Thu 5 Nov, 16:00-17:00',
        model_text: "I'll add the haircut.",
        payload: { name: 'Haircut', start_date: '2026-11-05', description: 'not a change label' },
      },
    }
    const turns = [
      { id: 'u-setup', role: 'user', content: 'I work 5 days, 5 nights, 5 off' },
      { id: 'u-hair', role: 'user', content: 'Book a haircut on Thursday' },
    ]
    assert.deepEqual(blankDaysProposalIdsToDecline([hidden, newer], turns, true), ['old'])
    assert.equal(newestVisibleProposal([hidden, newer], turns)?.id, 'new')
    assert.equal(proposalCardText(newer), 'Add Haircut on Thu 5 Nov, 16:00-17:00')
    assert.equal(proposalModelNote(newer), "I'll add the haircut.")
    assert.equal(proposalCardText(newer).includes('not a change label'), false)
  })

  it('shows the newest pending proposal after a reload', () => {
    const older = {
      id: 'older',
      created_at: '2026-10-22T01:00:00Z',
      message_id: 'u1',
      command: { action: 'add_leave', explanation: 'Mark Tue 27 Oct as leave', payload: { start_date: '2026-10-27' } },
    }
    const newest = {
      id: 'newest',
      created_at: '2026-10-22T03:00:00Z',
      message_id: 'u2',
      command: { action: 'add_commitment', explanation: 'Add Haircut on Thu 5 Nov', payload: { name: 'Haircut' } },
    }
    const turns = [
      { id: 'u1', role: 'user', content: 'I need leave on 27 Oct' },
      { id: 'u2', role: 'user', content: 'Book a haircut' },
    ]
    assert.equal(newestVisibleProposal([older, newest], turns)?.id, 'newest')
    assert.equal(newestVisibleProposal([newest, older], turns)?.id, 'newest')
  })

  it('hides a blank-days card without declining when history did not load', () => {
    const proposal = {
      id: 'p-blank',
      message_id: 'u-setup',
      command: { action: 'override_days', payload: { work_type: 'blank' } },
    }
    assert.deepEqual(blankDaysProposalIdsToDecline([proposal], [], false), [])
    assert.equal(newestVisibleProposal([proposal], [], false), null)
  })

  it('hides a blank-days card without declining when its source message is missing', () => {
    const proposal = {
      id: 'p-blank',
      message_id: 'missing',
      command: { action: 'override_days', payload: { work_type: 'blank' } },
    }
    const raw = [{ id: 'other', role: 'user', content: 'Book a haircut' }]
    assert.deepEqual(blankDaysProposalIdsToDecline([proposal], raw, true), [])
    assert.equal(newestVisibleProposal([proposal], raw, true), null)
  })

  it('declines a blank-days card whose source is the onboarding prompt', () => {
    const proposal = {
      id: 'p-blank',
      message_id: 'u-parse',
      command: { action: 'override_days', payload: { work_type: 'blank' } },
    }
    const raw = [{
      id: 'u-parse',
      role: 'user',
      content: 'The user is describing their work shift rotation pattern: "5-5-5". Respond in this EXACT JSON format.',
    }]
    assert.deepEqual(blankDaysProposalIdsToDecline([proposal], raw, true), ['p-blank'])
    assert.equal(newestVisibleProposal([proposal], raw, true), null)
  })

  it('shows one copy of a message sent while a proposal card is pending', () => {
    const saved = { id: 'srv-1', role: 'user', content: 'Book a haircut', created_at: '' }
    const card = { id: 'asst-1', role: 'assistant', content: 'Clear the days before Oct 22', created_at: '', proposal: { id: 'p1' } }
    const optimistic = { id: 'temp-1', role: 'user', content: 'Book a haircut', created_at: '' }
    const shown = messagesAfterSend([saved, card, optimistic], 'temp-1', saved, null)
    assert.equal(shown.filter((message) => message.role === 'user' && message.content === 'Book a haircut').length, 1)
    const dismissed = stalePendingCards(shown)
    assert.equal(dismissed.find((message) => message.id === 'asst-1')?.isProposal, false)
  })

  it('does not repeat a user message already stored when the proposal reply echoes it', () => {
    const saved = { id: 'srv-1', role: 'user', content: 'Book a dentist appointment', created_at: '' }
    const optimistic = { id: 'temp-1', role: 'user', content: 'Book a dentist appointment', created_at: '' }
    const card = {
      id: 'asst-1',
      role: 'assistant',
      content: 'Add Dentist appointment on Tue 27 Oct, 10–11am',
      created_at: '',
      proposal: { id: 'p1' },
    }
    const shown = messagesAfterSend([saved, optimistic], 'temp-1', saved, card)
    assert.equal(shown.filter((message) => message.role === 'user').length, 1)
    assert.equal(shown.filter((message) => message.role === 'user')[0].id, 'srv-1')
  })
})
