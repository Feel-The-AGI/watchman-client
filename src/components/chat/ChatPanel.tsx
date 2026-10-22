'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Undo2, Redo2, CheckCircle, XCircle, AlertTriangle, Sparkles, Command } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { approvalUpgradeMessage, FREE_HORIZON_MESSAGE, freeHorizonNotice } from '@/lib/free-horizon'
import { FreeHorizonNotice } from '@/components/upgrade/FreeHorizonNotice'
import {
  appliedConfirmation,
  chatInputLocked,
  chatMessageText,
  chatScrollBehavior,
  chatScrollTop,
  chatTextParts,
  displayedChatParts,
  friendlyChatError,
  isInternalChatMessage,
  mergeChatHistory,
  messagesAfterSend,
  blankDaysProposalIdsToDecline,
  newestVisibleProposal,
  proposalAppliedText,
  proposalCardText,
  proposalModelNote,
  stalePendingCards,
  REVIEW_FAILURE_MESSAGE,
  type ChatTextPart,
} from '@/lib/chat-display'

function ChatBubbleText({ role, content, fallback }: { role?: string; content: unknown; fallback?: string }) {
  const parts = displayedChatParts(role || 'assistant', content)
  const shown = parts.length > 0 ? parts : chatTextParts(fallback)
  if (shown.length === 0) return null
  return (
    <>
      {shown.map((part, index) => (
        <ChatTextPartView key={index} part={part} />
      ))}
    </>
  )
}

function ChatTextPartView({ part }: { part: ChatTextPart }) {
  if (part.kind === 'bold') return <strong>{part.text}</strong>
  if (part.kind === 'em') return <em>{part.text}</em>
  if (part.kind === 'code') return <code className="font-mono text-[0.85em]">{part.text}</code>
  return <span>{part.text}</span>
}

function errorText(error: unknown, fallback: string) {
  return friendlyChatError(error, fallback)
}

function apiStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    return typeof status === 'number' ? status : null
  }
  return null
}

function withProposalCard(messages: Message[], proposal: any | null): Message[] {
  if (!proposal?.id) return messages

  const existingIndex = messages.findIndex(message => message.proposal?.id === proposal.id)
  if (existingIndex >= 0) {
    const next = [...messages]
    const current = next[existingIndex]
    next[existingIndex] = {
      ...current,
      content: proposalCardText(proposal, current.content),
      isProposal: true,
      proposal,
    }
    return next
  }

  // The saved proposal points at the user message that triggered it. Attach the
  // review controls to the assistant reply that followed, instead of repeating it.
  const userIndex = proposal.message_id
    ? messages.findIndex(message => message.id === proposal.message_id)
    : -1
  if (userIndex >= 0) {
    const assistantIndex = messages.findIndex((message, index) => (
      index > userIndex && message.role === 'assistant' && !message.proposal
    ))
    if (assistantIndex >= 0) {
      const next = [...messages]
      const current = next[assistantIndex]
      next[assistantIndex] = {
        ...current,
        content: proposalCardText(proposal, current.content),
        isProposal: true,
        proposal,
      }
      return next
    }
  }

  return [...messages, {
    id: `proposal-${proposal.id}`,
    role: 'assistant',
    content: proposalCardText(proposal),
    created_at: proposal.created_at || new Date().toISOString(),
    isProposal: true,
    proposal,
  }]
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  command_id?: string
  created_at: string
  isProposal?: boolean
  proposal?: any
  freeHorizon?: boolean
}

interface ChatPanelProps {
  onCalendarUpdate?: () => void | Promise<void>
  className?: string
  autoExecute?: boolean  // If false, shows approval popup for commands
  userTier?: 'free' | 'pro'
}

export function ChatPanel({ onCalendarUpdate, className, autoExecute = false, userTier = 'free' }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingProposal, setPendingProposal] = useState<any>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [historyLimitReached, setHistoryLimitReached] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const rawHistoryRef = useRef<Message[]>([])
  const historyLoadedRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  // Stay inside the chat scroller. The first history paint jumps to the newest message.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current
    if (!container || messages.length === 0) return
    const pin = () => {
      const node = messagesContainerRef.current
      if (!node) return
      node.scrollTop = chatScrollTop(node.scrollHeight, node.clientHeight)
    }
    if (!initialLoadComplete) {
      pin()
      const frame = requestAnimationFrame(pin)
      return () => cancelAnimationFrame(frame)
    }
    container.scrollTo({
      top: chatScrollTop(container.scrollHeight, container.clientHeight),
      behavior: chatScrollBehavior(true),
    })
  }, [messages, initialLoadComplete])

  const choosePendingProposal = async () => {
    const pending = await api.commands.pendingProposals()
    const list = Array.isArray(pending?.proposals) ? pending.proposals : []
    const rawHistory = rawHistoryRef.current
    const historyLoaded = historyLoadedRef.current
    await Promise.all(blankDaysProposalIdsToDecline(list, rawHistory, historyLoaded).map(async (id) => {
      try {
        await api.commands.reviewProposal(id, 'reject')
      } catch (error) {
        console.error('Failed to decline an unrequested proposal:', error)
      }
    }))
    return newestVisibleProposal(list, rawHistory, historyLoaded)
  }

  const loadHistory = async () => {
    let history: Message[] = []
    let historyLoaded = false
    const limit = userTier === 'pro' ? 100 : 50

    const pullHistory = async () => {
      const response = await api.chat.getHistory(limit)
      const raw = Array.isArray(response?.messages) ? response.messages as Message[] : []
      rawHistoryRef.current = raw
      history = raw
        .filter((message) => !isInternalChatMessage(message))
        .map((message) => ({
          ...message,
          content: chatMessageText(message.content) || '',
        }))
        .filter((message) => message.content.length > 0)
        .reverse()
      const historyLimit = typeof response?.history_limit === 'number' ? response.history_limit : null
      setHistoryLimitReached(historyLimit !== null && history.length >= historyLimit)
      historyLoaded = true
      historyLoadedRef.current = true
      setHistoryError(null)
    }

    try {
      await pullHistory()
    } catch (error) {
      // A cold start can fail the first request even though the server is up. Retry once before showing the banner.
      if (apiStatus(error) === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        try {
          await pullHistory()
        } catch (retryError) {
          console.error('Failed to load chat history:', retryError)
          setHistoryError(errorText(retryError, 'Chat history is unavailable right now. You can try again in a moment.'))
        }
      } else {
        console.error('Failed to load chat history:', error)
        setHistoryError(errorText(error, 'Chat history is unavailable right now. You can try again in a moment.'))
      }
    }

    try {
      const proposal = await choosePendingProposal()
      setPendingProposal(proposal)
      history = withProposalCard(history, proposal)
      if (historyLoaded) setHistoryError(null)
    } catch (error) {
      console.error('Failed to load pending proposals:', error)
      // History already proved the server is reachable. Don't raise the red banner for this secondary call.
      if (!historyLoaded) {
        setHistoryError(previous => previous || errorText(
          error,
          'Could not check for calendar changes waiting on your review. Refresh before sending a new message.'
        ))
      }
    }

    setMessages((current) => mergeChatHistory(current, history))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInitialLoadComplete(true))
    })
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || isLoading || isReviewing) return
    
    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    const replacedId = pendingProposal?.id
    setPendingProposal(null)
    setMessages(prev => [...stalePendingCards(prev), tempUserMessage])

    try {
      if (replacedId) {
        try {
          await api.commands.reviewProposal(replacedId, 'reject')
        } catch (error) {
          console.error('Failed to decline the replaced proposal:', error)
        }
      }
      const response = await api.chat.sendMessage(userMessage, autoExecute)
      const savedUser = response.user_message
        ? {
          ...response.user_message,
          role: 'user' as const,
          content: chatMessageText(response.user_message.content) || userMessage,
        }
        : null
      if (freeHorizonNotice(response)) {
        setMessages(prev => messagesAfterSend(prev, tempUserMessage.id, savedUser, {
          id: `horizon-${Date.now()}`,
          role: 'assistant',
          content: FREE_HORIZON_MESSAGE,
          created_at: new Date().toISOString(),
          freeHorizon: true,
        }))
        setHistoryError(null)
        setPendingProposal(null)
        return
      }
      
      const assistantText = response.assistant_message
        ? chatMessageText(response.assistant_message.content)
        : null
      const assistantMessage: Message | null = response.assistant_message
        && assistantText
        && !isInternalChatMessage(response.assistant_message)
        ? {
          ...response.assistant_message,
          content: response.proposal ? proposalCardText(response.proposal, assistantText) : assistantText,
          isProposal: response.is_command,
          proposal: response.proposal,
        }
        : null
      setMessages(prev => messagesAfterSend(prev, tempUserMessage.id, savedUser, assistantMessage))
      setHistoryError(null)
      
      // Refresh calendar if a command was actually executed (not just proposed)
      if (response.execution?.success) {
        // Small delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500))
        onCalendarUpdate?.()
      }

      if (response.proposal) {
        setPendingProposal(response.proposal)
      }
      
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, freeHorizonNotice(error) ? {
        id: `horizon-${Date.now()}`,
        role: 'assistant',
        content: FREE_HORIZON_MESSAGE,
        created_at: new Date().toISOString(),
        freeHorizon: true,
      } : {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorText(error, 'Sorry, I had trouble processing that. Please try again.'),
        created_at: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const loadNextProposal = async () => {
    try {
      const visible = await choosePendingProposal()
      setPendingProposal(visible)
      setMessages(prev => withProposalCard(prev, visible))
    } catch (error) {
      console.error('Failed to reload pending proposals:', error)
    }
  }

  const noteReviewFailure = () => {
    setPendingProposal(null)
    setMessages(prev => [...prev, {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: REVIEW_FAILURE_MESSAGE,
      created_at: new Date().toISOString(),
    }])
  }

  const approveProposal = async (proposalId: string) => {
    if (isReviewing || !proposalId) return
    setIsReviewing(true)
    try {
      const proposal = pendingProposal?.id === proposalId ? pendingProposal : null
      const result = await api.commands.reviewProposal(proposalId, 'approve')

      if (!result?.success) {
        noteReviewFailure()
        return
      }

      setMessages(prev => [...prev, {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: appliedConfirmation(proposal) || proposalAppliedText(proposal, result),
        created_at: new Date().toISOString()
      }])
      setPendingProposal(null)
      await onCalendarUpdate?.()
      await loadNextProposal()
    } catch (error) {
      console.error('Failed to approve proposal:', error)
      const upgradeMessage = approvalUpgradeMessage(error)
      if (upgradeMessage) {
        setPendingProposal(null)
        setMessages(prev => [...prev, {
          id: `horizon-${Date.now()}`,
          role: 'assistant',
          content: upgradeMessage,
          created_at: new Date().toISOString(),
          freeHorizon: true,
        }])
        return
      }
      if (apiStatus(error) === 409) {
        setPendingProposal(null)
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'That proposal was already reviewed.',
          created_at: new Date().toISOString(),
        }])
        await loadNextProposal()
        return
      }
      noteReviewFailure()
    } finally {
      setIsReviewing(false)
    }
  }

  const rejectProposal = async () => {
    if (!pendingProposal || isReviewing) return
    setIsReviewing(true)
    const proposalId = pendingProposal.id
    try {
      const result = await api.commands.reviewProposal(proposalId, 'reject')
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        noteReviewFailure()
        return
      }
      setMessages(prev => [...prev, {
        id: `rejected-${Date.now()}`,
        role: 'assistant',
        content: 'The proposed change was declined.',
        created_at: new Date().toISOString()
      }])
      setPendingProposal(null)
      await loadNextProposal()
    } catch (error) {
      console.error('Failed to decline proposal:', error)
      if (apiStatus(error) === 409) {
        setPendingProposal(null)
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'That proposal was already reviewed.',
          created_at: new Date().toISOString(),
        }])
        await loadNextProposal()
        return
      }
      noteReviewFailure()
    } finally {
      setIsReviewing(false)
    }
  }

  const handleUndo = async () => {
    try {
      const result = await api.commands.undo()
      if (result.success) {
        setMessages(prev => [...prev, {
          id: `undo-${Date.now()}`,
          role: 'assistant',
          content: 'Undone! The last change has been reverted.',
          created_at: new Date().toISOString()
        }])
        onCalendarUpdate?.()
      }
    } catch (error) {
      console.error('Failed to undo:', error)
    }
  }

  const handleRedo = async () => {
    try {
      const result = await api.commands.redo()
      if (result.success) {
        setMessages(prev => [...prev, {
          id: `redo-${Date.now()}`,
          role: 'assistant',
          content: 'Redone! The change has been reapplied.',
          created_at: new Date().toISOString()
        }])
        onCalendarUpdate?.()
      }
    } catch (error) {
      console.error('Failed to redo:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn(
      'flex flex-col h-full glass rounded-2xl border border-white/5 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/20">
              <Command className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-watchman-success rounded-full border-2 border-watchman-surface" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold">Watchman Agent</h2>
            <p className="text-[10px] sm:text-xs text-watchman-muted hidden sm:block">Talk naturally about your schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={handleUndo}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-watchman-muted hover:text-white"
            title="Undo last change"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
          <motion.button
            onClick={handleRedo}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-watchman-muted hover:text-white"
            title="Redo last undone change"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>

      {historyError && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {historyError}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !historyError && (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-watchman-accent/10 to-watchman-purple/10 border border-white/5 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-watchman-accent" />
            </div>
            <p className="text-sm text-watchman-text-secondary mb-2">Start by telling me about your schedule</p>
            <p className="text-xs text-watchman-muted max-w-[200px] mx-auto">
              Try: "I work 5 days, 5 nights, 5 off. Jan 1 2026 is my Day 4."
            </p>
          </motion.div>
        )}
        
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Bot className="w-4 h-4 text-watchman-accent" />
                </div>
              )}
              
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                message.role === 'user' 
                  ? 'bg-watchman-accent text-white rounded-br-lg shadow-lg shadow-watchman-accent/20' 
                  : 'glass border border-white/5 text-watchman-text rounded-bl-lg'
              )}>
                {message.freeHorizon ? (
                  <FreeHorizonNotice message={message.content} compact />
                ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  <ChatBubbleText
                    role={message.role}
                    content={message.role === 'user'
                      ? message.content
                      : message.proposal
                        ? proposalCardText(message.proposal, message.content)
                        : message.content}
                  />
                </p>
                )}
                {message.proposal && proposalModelNote(message.proposal) && (
                  <p className="mt-2 text-xs text-watchman-muted whitespace-pre-wrap">
                    {proposalModelNote(message.proposal)}
                  </p>
                )}
                
                {/* Proposal approval buttons */}
                {message.isProposal && message.proposal && pendingProposal?.id === message.proposal.id && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    {message.proposal.validation?.valid === false && message.proposal.validation?.violations?.[0]?.message && (
                      <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                        <ChatBubbleText
                          content={message.proposal.validation.violations[0].message}
                          fallback="That change is not allowed."
                        />
                        {' '}Decline this change, or edit the request.
                      </div>
                    )}
                    {message.proposal.validation?.warnings?.length > 0 && (
                      <motion.div 
                        className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start gap-2 text-amber-400 text-xs">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <ChatBubbleText content={message.proposal.validation.warnings[0].message || 'Review this warning before applying the change.'} />
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => approveProposal(message.proposal.id)}
                        disabled={isReviewing || message.proposal.validation?.valid === false}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-watchman-success/20 hover:bg-watchman-success/30 text-watchman-success rounded-xl text-xs font-medium transition-colors border border-watchman-success/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        whileHover={isReviewing ? undefined : { scale: 1.02 }}
                        whileTap={isReviewing ? undefined : { scale: 0.98 }}
                      >
                        {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Apply
                      </motion.button>
                      <motion.button
                        onClick={rejectProposal}
                        disabled={isReviewing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-colors border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        whileHover={isReviewing ? undefined : { scale: 1.02 }}
                        whileTap={isReviewing ? undefined : { scale: 0.98 }}
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center border border-white/5">
              <Bot className="w-4 h-4 text-watchman-accent" />
            </div>
            <div className="glass border border-white/5 rounded-2xl rounded-bl-lg px-4 py-3">
              <div className="flex gap-1.5">
                <motion.div 
                  className="w-2 h-2 bg-watchman-accent rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-watchman-accent rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-watchman-accent rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
        
      </div>

      {/* History Limit Notice for Free Users */}
      {historyLimitReached && userTier === 'free' && (
        <motion.div
          className="mx-4 mb-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-2 text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Showing the latest 50 messages.</span>
              <span className="text-amber-400/80"> That is the free history window. Free accounts can still send 100 messages each month. </span>
              <Link href="/pricing" className="text-watchman-accent hover:underline">Upgrade to Pro</Link>
              <span className="text-amber-400/80"> for a longer history.</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your schedule..."
              disabled={chatInputLocked(pendingProposal, isReviewing)}
              rows={1}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 glass border border-white/10 rounded-xl text-xs sm:text-sm text-watchman-text placeholder-watchman-muted focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:border-transparent resize-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading || chatInputLocked(pendingProposal, isReviewing)}
            className={cn(
              'px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center',
              input.trim() && !isLoading
                ? 'bg-watchman-accent hover:bg-watchman-accent-hover text-white shadow-lg shadow-watchman-accent/20'
                : 'glass border border-white/10 text-watchman-muted cursor-not-allowed'
            )}
            whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </motion.button>
        </div>
        <p className="text-[9px] sm:text-[10px] text-watchman-muted mt-1.5 sm:mt-2 text-center opacity-70 hidden sm:block">
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}

export default ChatPanel
