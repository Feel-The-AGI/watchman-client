'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Undo2, Redo2, CheckCircle, XCircle, AlertTriangle, Sparkles, Command } from 'lucide-react'
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

  useEffect(() => {
    loadHistory()
  }, [])

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
    
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await api.chat.sendMessage(userMessage, false)
      
      if (response.user_message) {
        setMessages(prev => prev.map(m => 
          m.id === tempUserMessage.id ? response.user_message : m
        ))
      }
      
      if (response.assistant_message) {
        const assistantMessage: Message = {
          ...response.assistant_message,
          isProposal: response.is_command,
          proposal: response.proposal
        }
        setMessages(prev => [...prev, assistantMessage])
      }
      
      if (response.proposal) {
        setPendingProposal(response.proposal)
      }
      
    } catch (error) {
      console.error('Failed to send message:', error)
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
      const proposal = pendingProposal
      if (proposal?.command) {
        const response = await api.chat.sendMessage(
          `Execute: ${JSON.stringify(proposal.command)}`,
          true
        )
        
        if (response.execution?.success) {
          setMessages(prev => [...prev, {
            id: `success-${Date.now()}`,
            role: 'assistant',
            content: `Done! ${proposal.command.explanation || 'Changes applied successfully.'}`,
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/20">
              <Command className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-watchman-success rounded-full border-2 border-watchman-surface" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Watchman Agent</h2>
            <p className="text-xs text-watchman-muted">Talk naturally about your schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button 
            onClick={handleUndo}
            className="p-2.5 rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-watchman-muted hover:text-white"
            title="Undo last change"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Undo2 className="w-4 h-4" />
          </motion.button>
          <motion.button 
            onClick={handleRedo}
            className="p-2.5 rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-watchman-muted hover:text-white"
            title="Redo last undone change"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Redo2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Proposal approval buttons */}
                {message.isProposal && message.proposal && pendingProposal?.id === message.proposal.id && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    {message.proposal.validation?.warnings?.length > 0 && (
                      <motion.div 
                        className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start gap-2 text-amber-400 text-xs">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{message.proposal.validation.warnings[0].message}</span>
                        </div>
                      </motion.div>
                    )}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => approveProposal(message.proposal.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-watchman-success/20 hover:bg-watchman-success/30 text-watchman-success rounded-xl text-xs font-medium transition-colors border border-watchman-success/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Apply
                      </motion.button>
                      <motion.button
                        onClick={rejectProposal}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-colors border border-red-500/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
              className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-sm text-watchman-text placeholder-watchman-muted focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:border-transparent resize-none transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'px-4 py-3 rounded-xl transition-all flex items-center justify-center',
              input.trim() && !isLoading
                ? 'bg-watchman-accent hover:bg-watchman-accent-hover text-white shadow-lg shadow-watchman-accent/20'
                : 'glass border border-white/10 text-watchman-muted cursor-not-allowed'
            )}
            whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        <p className="text-[10px] text-watchman-muted mt-2 text-center opacity-70">
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}

export default ChatPanel
