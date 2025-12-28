'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  MessageSquare,
  Shield,
  Clock,
  Layers,
  Play,
  Lock,
  Eye,
  CheckCircle,
  Sun,
  Moon,
  Coffee,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Stats for social proof
const stats = [
  { value: '365', label: 'Days Generated', suffix: '+' },
  { value: '15', label: 'Cycle Patterns', suffix: '+' },
  { value: '100', label: 'Uptime', suffix: '%' },
  { value: '0', label: 'Silent Changes', suffix: '' },
];

// Features with emotional copy
const features = [
  {
    title: 'Speak Your Pattern',
    description: '"5 days, 5 nights, 5 off. January 1st is Day 4." That\'s it. Your entire year materializes.',
    icon: MessageSquare,
    gradient: 'from-cyan-500 to-emerald-500',
  },
  {
    title: 'Rules That Never Break',
    description: 'No study on night shifts. Max 2 commitments per day. Set them once. Trust them forever.',
    icon: Shield,
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    title: 'Nothing Moves Silently',
    description: 'Every change is proposed. Every change is explained. You approve, or it doesn\'t happen.',
    icon: Eye,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    title: 'See The Whole Truth',
    description: '365 days at once. Patterns visible. Fatigue predictable. No more calendar amnesia.',
    icon: Layers,
    gradient: 'from-amber-500 to-yellow-500',
  },
];

// How it works - simplified
const steps = [
  { num: '01', title: 'Define Your Cycle', desc: 'Tell us your rotation. It becomes the foundation of your calendar.', icon: Clock },
  { num: '02', title: 'Set Your Boundaries', desc: 'Rules that never bend. Constraints that protect you.', icon: Shield },
  { num: '03', title: 'Propose Changes', desc: 'Need leave? New commitment? Just ask.', icon: MessageSquare },
  { num: '04', title: 'Approve & Move', desc: 'You decide. Nothing updates without your say.', icon: CheckCircle },
];

// Industries
const industries = [
  { name: 'Mining & FIFO', icon: '⛏️' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Security', icon: '🛡️' },
  { name: 'Aviation', icon: '✈️' },
  { name: 'Manufacturing', icon: '🏭' },
  { name: 'Emergency', icon: '🚑' },
];

// Floating calendar days for background animation
function FloatingDays() {
  const days = ['D', 'N', 'O', 'D', 'N', 'O', 'D', 'N'];
  const colors = {
    D: 'from-amber-400/20 to-orange-500/20 border-amber-500/30',
    N: 'from-indigo-400/20 to-purple-500/20 border-indigo-500/30',
    O: 'from-emerald-400/20 to-green-500/20 border-emerald-500/30',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {days.map((day, i) => (
        <motion.div
          key={i}
          className={`absolute w-12 h-12 rounded-xl bg-gradient-to-br ${colors[day as keyof typeof colors]} border backdrop-blur-sm flex items-center justify-center text-white/60 font-mono text-sm`}
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        >
          {day}
        </motion.div>
      ))}
    </div>
  );
}

// Animated counter for stats
function AnimatedCounter({ value, suffix }: { value: string; suffix: string }) {
  const [count, setCount] = useState(0);
  const numValue = parseInt(value);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numValue]);

  return <span>{count}{suffix}</span>;
}

// Particle type for New Year celebration
type CelebrationParticle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
  type: 'confetti' | 'firework' | 'spark';
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

// New Year Celebration Component - Confetti & Fireworks on January 1st!
function NewYearCelebration() {
  const [particles, setParticles] = useState<CelebrationParticle[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [fireworkBursts, setFireworkBursts] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
  }>>([]);

  useEffect(() => {
    // Check if it's January 1st
    const now = new Date();
    const isNewYear = now.getMonth() === 0 && now.getDate() === 1;

    if (!isNewYear) return;

    setShowCelebration(true);

    const colors = [
      '#22d3ee', // cyan
      '#4ade80', // green
      '#f59e0b', // amber
      '#ec4899', // pink
      '#8b5cf6', // violet
      '#ef4444', // red
      '#fbbf24', // yellow
      '#ffffff', // white
    ];

    // Create initial confetti burst
    const createConfetti = () => {
      const newParticles: CelebrationParticle[] = [];
      for (let i = 0; i < 150; i++) {
        newParticles.push({
          id: Math.random(),
          x: Math.random() * window.innerWidth,
          y: -20 - Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 8,
          velocity: {
            x: (Math.random() - 0.5) * 8,
            y: 2 + Math.random() * 4,
          },
          type: 'confetti' as const,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          opacity: 1,
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
    };

    // Create firework burst
    const createFirework = (x: number, y: number) => {
      const burstColor = colors[Math.floor(Math.random() * colors.length)];
      const burstId = Math.random();

      setFireworkBursts(prev => [...prev, { id: burstId, x, y, color: burstColor }]);

      const sparks: CelebrationParticle[] = [];
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        sparks.push({
          id: Math.random(),
          x,
          y,
          color: burstColor,
          size: 3 + Math.random() * 3,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          type: 'spark' as const,
          rotation: 0,
          rotationSpeed: 0,
          opacity: 1,
        });
      }
      setParticles(prev => [...prev, ...sparks]);

      // Remove burst after animation
      setTimeout(() => {
        setFireworkBursts(prev => prev.filter(b => b.id !== burstId));
      }, 500);
    };

    // Initial burst
    createConfetti();

    // Create multiple firework bursts over 10 seconds
    const fireworkInterval = setInterval(() => {
      createFirework(
        100 + Math.random() * (window.innerWidth - 200),
        100 + Math.random() * 300
      );
    }, 400);

    // Add more confetti waves
    const confettiInterval = setInterval(createConfetti, 2000);

    // Animate particles
    const animationInterval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            velocity: {
              x: p.velocity.x * 0.99,
              y: p.type === 'confetti' ? p.velocity.y + 0.1 : p.velocity.y + 0.15,
            },
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.type === 'spark' ? p.opacity * 0.96 : p.opacity,
          }))
          .filter(p => p.y < window.innerHeight + 50 && p.opacity > 0.1)
      );
    }, 16);

    // Stop celebration after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(fireworkInterval);
      clearInterval(confettiInterval);
      setTimeout(() => {
        clearInterval(animationInterval);
        setShowCelebration(false);
      }, 3000);
    }, 10000);

    return () => {
      clearInterval(fireworkInterval);
      clearInterval(confettiInterval);
      clearInterval(animationInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (!showCelebration) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Firework bursts */}
      {fireworkBursts.map(burst => (
        <motion.div
          key={burst.id}
          className="absolute rounded-full"
          style={{
            left: burst.x,
            top: burst.y,
            background: `radial-gradient(circle, ${burst.color} 0%, transparent 70%)`,
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {/* Confetti and sparks */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.type === 'confetti' ? particle.size * 0.6 : particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.type === 'spark' ? '50%' : '2px',
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            boxShadow: particle.type === 'spark' ? `0 0 ${particle.size * 2}px ${particle.color}` : 'none',
          }}
        />
      ))}

      {/* Happy New Year message */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
      >
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
            Happy New Year!
          </span>
        </h2>
        <p className="text-xl sm:text-2xl text-white/80">
          🎉 {new Date().getFullYear()} 🎉
        </p>
      </motion.div>
    </div>
  );
}

// Types for localStorage data
interface LandingNote {
  id: string;
  note: string;
  created_at: string;
}

interface LandingDayData {
  notes: LandingNote[];
}

// Helper to get localStorage key for a date
const getStorageKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `watchman_landing_${year}-${month}-${day}`;
};

// Landing Page Day Inspector - Simplified version with localStorage
interface LandingDayInspectorProps {
  date: Date;
  workType: 'day_shift' | 'night_shift' | 'off';
  onClose: () => void;
}

function LandingDayInspector({ date, workType, onClose }: LandingDayInspectorProps) {
  const [notes, setNotes] = useState<LandingNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('notes');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const workTypeInfo = {
    day_shift: {
      icon: Sun,
      label: 'Day Shift',
      color: 'text-amber-400',
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      gradient: 'from-amber-500/20 to-transparent',
    },
    night_shift: {
      icon: Moon,
      label: 'Night Shift',
      color: 'text-indigo-400',
      bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      gradient: 'from-indigo-500/20 to-transparent',
    },
    off: {
      icon: Coffee,
      label: 'Off Day',
      color: 'text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      gradient: 'from-emerald-500/20 to-transparent',
    },
  };

  const info = workTypeInfo[workType];

  // Load data from localStorage
  useEffect(() => {
    const key = getStorageKey(date);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data: LandingDayData = JSON.parse(stored);
        setNotes(data.notes || []);
      } catch {
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
  }, [date]);

  // Save to localStorage
  const saveToStorage = (newNotes: LandingNote[]) => {
    const key = getStorageKey(date);
    const data: LandingDayData = { notes: newNotes };
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: LandingNote = {
      id: `note-${Date.now()}`,
      note: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [...notes, note];
    setNotes(updated);
    saveToStorage(updated);
    setNewNote('');
    setShowAddNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    saveToStorage(updated);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full max-w-sm rounded-2xl bg-[#0d1117] border border-white/10 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className={`relative px-5 py-4 border-b border-white/5 bg-gradient-to-r ${info.gradient}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              {dayNames[date.getDay()]}
            </h3>
            <p className="text-sm text-white/50 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {monthNames[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Work Type Display */}
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${info.gradient}`}>
          <div className={`w-10 h-10 rounded-xl ${info.bg} flex items-center justify-center shadow-lg`}>
            <info.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white">{info.label}</p>
            <p className="text-xs text-white/50">5-5-5 rotation pattern</p>
          </div>
        </div>

        {/* Daily Notes Section */}
        <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'notes' ? null : 'notes')}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-white">Daily Notes</p>
                <p className="text-xs text-white/40">{notes.length} note{notes.length !== 1 ? 's' : ''} recorded</p>
              </div>
            </div>
            {expandedSection === 'notes' ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'notes' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-3 space-y-2">
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-2.5 bg-white/5 rounded-lg group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm text-white/80 flex-1">{note.note}</p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1.5">{formatTime(note.created_at)}</p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-white/30 text-center py-3">No notes yet</p>
                  )}

                  {showAddNote ? (
                    <div className="space-y-2 pt-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="What's on your mind for this day?"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => { setShowAddNote(false); setNewNote(''); }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Note
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Incidents Section (Display Only) */}
        <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'incidents' ? null : 'incidents')}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-white">Incidents & Issues</p>
                <p className="text-xs text-white/40">0 incidents logged</p>
              </div>
            </div>
            {expandedSection === 'incidents' ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'incidents' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-3 text-center py-6">
                  <p className="text-sm text-white/30">No incidents logged</p>
                  <p className="text-xs text-white/20 mt-1">Sign up to track incidents</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Commitments Section (Display Only) */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">
            Commitments
          </h4>
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <BookOpen className="w-5 h-5 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/30">No commitments</p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <Link href="/login">
          <button className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/20">
            Sign Up to Track Everything
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

// Live Calendar Component - Shows REAL current month with today highlighted
interface LiveCalendarProps {
  selectedDate: Date | null;
  onDayClick: (date: Date, workType: 'day_shift' | 'night_shift' | 'off') => void;
}

function LiveCalendar({ selectedDate, onDayClick }: LiveCalendarProps) {
  // Track the actual "today" date (never changes)
  const realToday = useMemo(() => new Date(), []);
  const todayDate = realToday.getDate();
  const todayMonth = realToday.getMonth();
  const todayYear = realToday.getFullYear();

  // Track the currently viewed month (can be navigated)
  const [viewDate, setViewDate] = useState(new Date());
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // Navigation functions
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Check if we're viewing the current month (to show "today" highlight)
  const isCurrentMonth = viewMonth === todayMonth && viewYear === todayYear;

  // Get month details
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sunday=0 to Monday=0 format
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, type: 'empty' });
    }
    // Actual days with 5-5-5 rotation pattern
    for (let day = 1; day <= daysInMonth; day++) {
      const cycleDay = (day - 1) % 15;
      let type: 'day_shift' | 'night_shift' | 'off';
      if (cycleDay < 5) type = 'day_shift';
      else if (cycleDay < 10) type = 'night_shift';
      else type = 'off';
      // Only mark as "today" if viewing current month and it's the actual today
      const isToday = isCurrentMonth && day === todayDate;
      days.push({ day, type, isToday });
    }
    return days;
  }, [daysInMonth, startDay, todayDate, isCurrentMonth]);

  // Work type styles matching the actual app
  const getWorkTypeStyle = (type: string, isToday: boolean) => {
    const baseStyles = {
      day_shift: 'bg-amber-500/20 border-amber-500/30',
      night_shift: 'bg-indigo-500/20 border-indigo-500/30',
      off: 'bg-emerald-500/20 border-emerald-500/30',
      empty: 'bg-transparent border-transparent',
    };

    const todayRing = isToday ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0d1117]' : '';
    return `${baseStyles[type as keyof typeof baseStyles] || baseStyles.empty} ${todayRing}`;
  };

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case 'day_shift':
        return <Sun className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />;
      case 'night_shift':
        return <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />;
      case 'off':
        return <Coffee className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
      {/* Calendar Header - Like the app */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/5">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-white">
            {monthNames[viewMonth]} {viewYear}
          </h3>
          {/* "Today" button - only show when not viewing current month */}
          {!isCurrentMonth && (
            <button
              onClick={() => setViewDate(new Date())}
              className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="py-2 text-center text-[10px] font-medium text-white/40">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div key={`${viewMonth}-${viewYear}`} className="grid grid-cols-7 gap-px bg-white/5 p-px">
        {calendarDays.map((item, i) => {
          // Check if this day is selected
          const dayDate = item.day ? new Date(viewYear, viewMonth, item.day) : null;
          const isSelected = selectedDate && dayDate &&
            selectedDate.getDate() === dayDate.getDate() &&
            selectedDate.getMonth() === dayDate.getMonth() &&
            selectedDate.getFullYear() === dayDate.getFullYear();

          return (
            <motion.div
              key={`${viewMonth}-${viewYear}-${i}`}
              className={`relative py-2 sm:py-3 bg-[#0d1117] flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                item.day ? 'hover:bg-white/5 cursor-pointer' : ''
              } ${isSelected ? 'bg-cyan-500/10 ring-1 ring-cyan-500/50' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005, duration: 0.2 }}
              onClick={() => {
                if (item.day && item.type !== 'empty') {
                  const clickedDate = new Date(viewYear, viewMonth, item.day);
                  onDayClick(clickedDate, item.type as 'day_shift' | 'night_shift' | 'off');
                }
              }}
            >
              {item.day && (
                <>
                  {/* Day number */}
                  <span className={`text-[10px] sm:text-xs font-medium ${item.isToday ? 'text-cyan-400' : isSelected ? 'text-cyan-300' : 'text-white/60'}`}>
                    {item.day}
                  </span>

                  {/* Work type icon */}
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center transition-all duration-200 ${getWorkTypeStyle(item.type, item.isToday || false)}`}
                  >
                    {getWorkTypeIcon(item.type)}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 py-2.5 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span className="text-[10px] text-white/50">Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Moon className="w-2.5 h-2.5 text-indigo-400" />
          </div>
          <span className="text-[10px] text-white/50">Night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Coffee className="w-2.5 h-2.5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-white/50">Off</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // State for day inspector
  const [selectedDay, setSelectedDay] = useState<{ date: Date; workType: 'day_shift' | 'night_shift' | 'off' } | null>(null);

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const isLoggedIn = !!user && !loading;

  // Handle day click from calendar
  const handleDayClick = (date: Date, workType: 'day_shift' | 'night_shift' | 'off') => {
    // Toggle selection if clicking same day
    if (selectedDay &&
        selectedDay.date.getDate() === date.getDate() &&
        selectedDay.date.getMonth() === date.getMonth() &&
        selectedDay.date.getFullYear() === date.getFullYear()) {
      setSelectedDay(null);
    } else {
      setSelectedDay({ date, workType });
    }
  };

  // Track mouse for subtle parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* New Year Celebration - Only on January 1st */}
      <NewYearCelebration />

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
            x: mousePosition.x * 0.5,
            y: mousePosition.y * 0.5,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
            x: mousePosition.x * -0.3,
            y: mousePosition.y * -0.3,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-6 py-4 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Image
                    src="/watchman-logo.png"
                    alt="Watchman"
                    width={40}
                    height={40}
                    className="relative object-contain rounded-full"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight">Watchman</span>
              </Link>

              <div className="flex items-center gap-6">
                <Link href="/pricing" className="text-white/60 hover:text-white transition-colors hidden sm:block text-sm">
                  Pricing
                </Link>
                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                      <Button variant="primary" size="sm" className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 border-0">
                        Dashboard
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="glass" size="sm" className="border-white/10 hover:border-white/20 hover:bg-white/5">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <FloatingDays />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Problem Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm text-rose-400">Your calendar is lying to you</span>
          </motion.div>

          {/* Main Headline - Emotional */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[0.9] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="text-white">Your Life Isn't</span>
            <br />
            <span className="text-white/40">Event-Based.</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              It's Rule-Based.
            </span>
          </motion.h1>

          {/* Subheadline - Pain Point */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/50 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Rotating shifts. Night work. Cycles that repeat.
            <br className="hidden sm:block" />
            <span className="text-white/70">Most calendars don't understand. This one does.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link href="/login">
              <Button
                variant="primary"
                size="xl"
                className="group bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 px-8"
              >
                <Lock className="w-5 h-5 mr-2" />
                Take Back Control
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="ghost" size="xl" className="text-white/60 hover:text-white hover:bg-white/5 border border-white/10">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-1 h-2 rounded-full bg-gradient-to-b from-cyan-400 to-emerald-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Hero Product Preview - LIVE Calendar with Day Inspector */}
      <section className="relative py-16 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
            {/* Calendar */}
            <motion.div
              className="relative w-full lg:w-auto lg:flex-1 max-w-xl"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Glow effect behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-green-500/20 rounded-3xl blur-2xl" />

              {/* Live Calendar - Shows REAL current month with today highlighted */}
              <div className="relative shadow-2xl">
                <LiveCalendar
                  selectedDate={selectedDay?.date || null}
                  onDayClick={handleDayClick}
                />
              </div>

              {/* "Live" indicator badge */}
              <motion.div
                className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-medium text-cyan-400">Live Preview</span>
                </div>
              </motion.div>

              {/* Click hint - show when no day selected */}
              {!selectedDay && (
                <motion.p
                  className="text-center text-xs text-white/40 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  Click any day to explore
                </motion.p>
              )}
            </motion.div>

            {/* Day Inspector - Shows when a day is selected */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  className="w-full lg:w-auto"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <LandingDayInspector
                    date={selectedDay.date}
                    workType={selectedDay.workType}
                    onClose={() => setSelectedDay(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-emerald-500/5 to-green-500/5" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-24 sm:py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 leading-tight">
              <span className="text-white/40">You're not disorganized.</span>
              <br />
              <span className="text-white">Your tools are.</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Most calendars are built for 9-to-5 office workers. They don't understand
              <span className="text-cyan-400"> rotating patterns</span>,
              <span className="text-emerald-400"> night shifts</span>, or
              <span className="text-amber-400"> FIFO swings</span>.
              They silently reschedule. They break your rules.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Built Different.
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Built Right.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              A temporal reasoning engine that understands how your life actually works.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Four Steps.
              <span className="text-white/40"> Zero Surprises.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="relative flex gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all duration-300"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                    <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{step.num}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    <step.icon className="w-4 h-4 text-cyan-400" />
                    {step.title}
                  </h3>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries - Infinite Scrolling Marquee */}
      <section className="py-20 sm:py-28 overflow-hidden">
        <div className="text-center mb-10 px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            If Your Life Runs on Cycles,
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Watchman Fits.</span>
          </h2>
          <p className="text-white/40 text-sm">
            And anyone tired of fighting their calendar every week.
          </p>
        </div>

        {/* Infinite scrolling marquee */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="flex animate-marquee">
            {/* First set */}
            {[...industries, ...industries].map((industry, i) => (
              <div
                key={`${industry.name}-${i}`}
                className="flex-shrink-0 mx-3"
              >
                <div className="relative flex items-center gap-3 px-6 py-4 rounded-2xl overflow-hidden cursor-default group
                  bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent
                  border border-emerald-500/20
                  shadow-[0_8px_32px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
                  hover:shadow-[0_8px_40px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
                  hover:border-emerald-400/40
                  hover:from-emerald-500/15 hover:via-cyan-500/10 hover:to-transparent
                  backdrop-blur-xl transition-all duration-300"
                >
                  {/* Glossy shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-cyan-500/5" />
                  <span className="relative text-2xl group-hover:scale-110 transition-transform drop-shadow-lg">{industry.icon}</span>
                  <span className="relative text-sm font-medium text-white/80 group-hover:text-white transition-colors whitespace-nowrap">{industry.name}</span>
                </div>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {[...industries, ...industries].map((industry, i) => (
              <div
                key={`${industry.name}-dup-${i}`}
                className="flex-shrink-0 mx-3"
              >
                <div className="relative flex items-center gap-3 px-6 py-4 rounded-2xl overflow-hidden cursor-default group
                  bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent
                  border border-emerald-500/20
                  shadow-[0_8px_32px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
                  hover:shadow-[0_8px_40px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
                  hover:border-emerald-400/40
                  hover:from-emerald-500/15 hover:via-cyan-500/10 hover:to-transparent
                  backdrop-blur-xl transition-all duration-300"
                >
                  {/* Glossy shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-cyan-500/5" />
                  <span className="relative text-2xl group-hover:scale-110 transition-transform drop-shadow-lg">{industry.icon}</span>
                  <span className="relative text-sm font-medium text-white/80 group-hover:text-white transition-colors whitespace-nowrap">{industry.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 sm:py-40 px-6 relative">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-cyan-500/20 via-emerald-500/10 to-transparent blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Logo */}
            <motion.div
              className="relative w-20 h-20 mx-auto mb-8"
              animate={{
                boxShadow: ['0 0 40px rgba(34, 211, 238, 0.3)', '0 0 60px rgba(74, 222, 128, 0.3)', '0 0 40px rgba(34, 211, 238, 0.3)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full blur-xl opacity-50" />
              <Image
                src="/watchman-logo.png"
                alt="Watchman"
                width={80}
                height={80}
                className="relative object-contain rounded-full"
              />
            </motion.div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Stop Managing Time.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Start Guarding It.</span>
            </h2>

            <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-xl mx-auto">
              Define your rules. Generate your year. See the truth.
              <br />
              <span className="text-white/70">No credit card required.</span>
            </p>

            <Link href="/login">
              <Button
                variant="primary"
                size="xl"
                className="group bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 border-0 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 px-10 py-6 text-lg"
              >
                Guard Your Hours
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/watchman-logo.png"
                alt="Watchman"
                width={32}
                height={32}
                className="object-contain rounded-full"
              />
              <span className="font-semibold text-white">Watchman</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} Watchman. Time under control.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}