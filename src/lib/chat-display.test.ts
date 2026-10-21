import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  chatInputLocked,
  chatMessageText,
  isInternalChatMessage,
  mergeChatHistory,
  messagesAfterSend,
  proposalAppliedText,
  proposalCardText,
  REVIEW_FAILURE_MESSAGE,
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
    assert.equal(chatInputLocked({ id: 'proposal-1' }, false), true)
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
})
