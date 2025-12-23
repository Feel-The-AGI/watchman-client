'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Undo2, RotateCcw, CheckCircle, XCircle, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  command_id?: string
  created_at: string
  isProposal?: boolean
  proposal?: any
}

interface ChatPanelProps {
  onCalendarUpdate?: () => void
  className?: string
}

export function ChatPanel({ onCalendarUpdate, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingProposal, setPendingProposal] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const response = await api.chat.getHistory(50)
      if (response.messages) {
        setMessages(response.messages.reverse())
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    
    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await api.chat.sendMessage(userMessage, false) // Don't auto-execute
      
      // Update with real messages
      if (response.user_message) {
        setMessages(prev => prev.map(m => 
          m.id === tempUserMessage.id ? response.user_message : m
        ))
      }
      
      // Add assistant response
      if (response.assistant_message) {
        const assistantMessage: Message = {
          ...response.assistant_message,
          isProposal: response.is_command,
          proposal: response.proposal
        }
        setMessages(prev => [...prev, assistantMessage])
      }
      
      // If there's a proposal, set it for approval UI
      if (response.proposal) {
        setPendingProposal(response.proposal)
      }
      
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const approveProposal = async (proposalId: string) => {
    try {
      // Execute the command from the proposal
      const proposal = pendingProposal
      if (proposal?.command) {
        const response = await api.chat.sendMessage(
          `Execute: ${JSON.stringify(proposal.command)}`,
          true // Auto-execute
        )
        
        if (response.execution?.success) {
          setMessages(prev => [...prev, {
            id: `success-${Date.now()}`,
            role: 'assistant',
            content: `✅ Done! ${proposal.command.explanation || 'Changes applied successfully.'}`,
            created_at: new Date().toISOString()
          }])
          onCalendarUpdate?.()
        }
      }
      setPendingProposal(null)
    } catch (error) {
      console.error('Failed to approve proposal:', error)
    }
  }

  const rejectProposal = () => {
    setMessages(prev => [...prev, {
      id: `rejected-${Date.now()}`,
      role: 'assistant',
      content: 'No problem, I won\'t make that change. Is there something else I can help with?',
      created_at: new Date().toISOString()
    }])
    setPendingProposal(null)
  }

  const handleUndo = async () => {
    try {
      const result = await api.commands.undo()
      if (result.success) {
        setMessages(prev => [...prev, {
          id: `undo-${Date.now()}`,
          role: 'assistant',
          content: '↩️ Undone! The last change has been reverted.',
          created_at: new Date().toISOString()
        }])
        onCalendarUpdate?.()
      }
    } catch (error) {
      console.error('Failed to undo:', error)
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
      'flex flex-col h-full bg-watchman-surface rounded-2xl border border-white/5 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-watchman-accent to-watchman-mint flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Watchman Agent</h2>
            <p className="text-xs text-watchman-muted">Tell me about your schedule</p>
          </div>
        </div>
        <button 
          onClick={handleUndo}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-watchman-muted hover:text-white"
          title="Undo last change"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-watchman-muted">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start by telling me about your work schedule.</p>
            <p className="text-xs mt-2 opacity-70">
              Try: "I work 5 days, 5 nights, 5 off. 12-hour shifts. Jan 1 2026 is my Day 4."
            </p>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-watchman-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-watchman-accent" />
                </div>
              )}
              
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5',
                message.role === 'user' 
                  ? 'bg-watchman-accent text-white rounded-br-sm' 
                  : 'bg-white/5 text-watchman-text rounded-bl-sm'
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Proposal approval buttons */}
                {message.isProposal && message.proposal && pendingProposal?.id === message.proposal.id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {message.proposal.validation?.warnings?.length > 0 && (
                      <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-400 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {message.proposal.validation.warnings[0].message}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveProposal(message.proposal.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Apply
                      </button>
                      <button
                        onClick={rejectProposal}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-watchman-accent/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-watchman-accent" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-watchman-muted" />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-white/5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your schedule..."
              rows={1}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-watchman-text placeholder-watchman-muted focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:border-transparent resize-none"
              style={{ minHeight: '46px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'px-4 py-3 rounded-xl transition-all flex items-center justify-center',
              input.trim() && !isLoading
                ? 'bg-watchman-accent hover:bg-watchman-accent/80 text-white'
                : 'bg-white/5 text-watchman-muted cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-watchman-muted mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}

export default ChatPanel
