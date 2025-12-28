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
} from 'lucide-react';
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

// Live Calendar Component - Shows REAL current month with today highlighted
function LiveCalendar() {
  const [currentDate] = useState(new Date());

  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get month details
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
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
      days.push({ day, type, isToday: day === today });
    }
    return days;
  }, [daysInMonth, startDay, today]);

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
        return <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />;
      case 'night_shift':
        return <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />;
      case 'off':
        return <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
      {/* Calendar Header - Like the app */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5">
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
          <div key={day} className="py-3 text-center text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/5 p-px">
        {calendarDays.map((item, i) => (
          <motion.div
            key={i}
            className={`relative aspect-square bg-[#0d1117] flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              item.day ? 'hover:bg-white/5 cursor-pointer' : ''
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.008, duration: 0.3 }}
          >
            {item.day && (
              <>
                {/* Day number and cycle indicator */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center gap-1">
                  <span className={`text-xs sm:text-sm font-medium ${item.isToday ? 'text-cyan-400' : 'text-white/80'}`}>
                    {item.day}
                  </span>
                </div>

                {/* Work type icon button */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 mt-2 rounded-xl border flex items-center justify-center transition-all duration-200 ${getWorkTypeStyle(item.type, item.isToday || false)}`}
                >
                  {getWorkTypeIcon(item.type)}
                </div>

                {/* Today indicator dot */}
                {item.isToday && (
                  <motion.div
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 py-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-xs text-white/50">Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Moon className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-xs text-white/50">Night</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Coffee className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-xs text-white/50">Off</span>
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

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const isLoggedIn = !!user && !loading;

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
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
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

          {/* Hero Product Preview - LIVE Calendar */}
          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {/* Glow effect behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-green-500/20 rounded-3xl blur-2xl" />

            {/* Live Calendar - Shows REAL current month with today highlighted */}
            <div className="relative shadow-2xl">
              <LiveCalendar />
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

      {/* Industries */}
      <section className="py-24 sm:py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              If Your Life Runs on Cycles,
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Watchman Fits.</span>
            </h2>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            {industries.map((industry, i) => (
              <motion.div
                key={industry.name}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 cursor-default"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: "easeOut"
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <span className="text-lg sm:text-xl">{industry.icon}</span>
                <span className="text-sm font-medium text-white/70">{industry.name}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="text-center text-white/40 text-sm mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            And anyone tired of fighting their calendar every week.
          </motion.p>
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
      <footer className="py-12 px-6 border-t border-white/5">
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
              <span className="font-semibold">Watchman</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Watchman. Time under control.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}