'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  BarChart3,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Zap,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Target,
  Layers,
  Command,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Bento Grid Features
const bentoFeatures = [
  {
    title: 'Conversational Setup',
    description: 'Just talk. "I work 5 days, 5 nights, 5 off. Jan 1 is my Day 4." Your calendar builds itself.',
    icon: MessageSquare,
    span: 2,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    title: 'Constraint Engine',
    description: 'Set hard rules. No study on night shifts. The system never breaks your boundaries.',
    icon: Shield,
    span: 1,
    gradient: 'from-red-500/20 to-orange-500/20',
    iconColor: 'text-red-400',
  },
  {
    title: 'Smart Proposals',
    description: 'Every change is proposed, explained, and waits for your approval. Nothing happens silently.',
    icon: Target,
    span: 1,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    title: 'Full Year Visibility',
    description: 'See 365 days at a glance. Patterns become visible. Plan months ahead with confidence.',
    icon: Layers,
    span: 2,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
];

// How it works steps
const steps = [
  {
    step: '01',
    title: 'Define Your Cycle',
    description: 'Tell us your rotation pattern and anchor date. "10 on, 5 nights, 10 off. Jan 1 = Day 4."',
    icon: Clock,
  },
  {
    step: '02',
    title: 'Set Constraints',
    description: 'Binary rules that never break. No study on nights. Max 2 commitments. Your boundaries.',
    icon: Shield,
  },
  {
    step: '03',
    title: 'Talk to the Agent',
    description: 'Need to add leave? A new course? Just chat. The agent understands and proposes changes.',
    icon: MessageSquare,
  },
  {
    step: '04',
    title: 'Approve & Live',
    description: 'Review every change. Approve or reject. Your calendar updates. Statistics update. Control.',
    icon: Check,
  },
];

// Industries
const industries = [
  { name: 'Mining & Resources', icon: '⛏️', desc: 'FIFO rotations, long swings' },
  { name: 'Healthcare', icon: '🏥', desc: 'Nursing shifts, on-call schedules' },
  { name: 'Security', icon: '🛡️', desc: '24/7 coverage, rotating crews' },
  { name: 'Transportation', icon: '✈️', desc: 'Pilots, rail, shift drivers' },
  { name: 'Manufacturing', icon: '🏭', desc: 'Factory rotations, overtime' },
  { name: 'Emergency', icon: '🚑', desc: 'First responders, variable shifts' },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading } = useAuth();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const isLoggedIn = !!user && !loading;

  return (
    <div ref={containerRef} className="min-h-screen bg-watchman-bg text-white overflow-hidden">
      {/* Mesh Background */}
      <div className="fixed inset-0 mesh-bg opacity-50 pointer-events-none" />
      
      {/* Noise Overlay */}
      <div className="fixed inset-0 noise-overlay pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image 
                src="/watchman-logo.png" 
                alt="Watchman" 
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Watchman</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-watchman-text-secondary hover:text-white transition-colors hidden sm:block">
              Pricing
            </Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="primary" size="sm">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center">
                    {profile?.name ? (
                      <span className="text-sm font-semibold text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="glass" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-6 pt-24"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-watchman-accent/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-watchman-purple/20 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-watchman-accent" />
              <span className="text-sm text-watchman-text-secondary">Conversational Calendar for Shift Workers</span>
            </motion.div>
            
            {/* Headline */}
            <h1 className="text-display-lg md:text-display-xl mb-8 leading-[0.95]">
              <span className="text-white">Time Under</span>
              <br />
              <span className="text-gradient">Control</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-watchman-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              A rule-driven calendar that understands rotating shifts. 
              Talk naturally. The agent listens. 
              <span className="text-white"> Nothing changes without your approval.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="primary" size="xl" className="group">
                  Create Your Year
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="glass" size="xl">
                  See How It Works
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div 
              className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Philosophy Banner */}
      <section className="py-16 px-6 border-y border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-watchman-accent/5 via-transparent to-watchman-purple/5" />
        <div className="max-w-4xl mx-auto text-center relative">
          <p className="text-2xl md:text-3xl font-light text-watchman-text-secondary italic">
            "Guard your hours. Live by rule, not noise."
          </p>
        </div>
      </section>

      {/* Bento Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-md mb-4">Built for Real Constraints</h2>
            <p className="text-xl text-watchman-text-secondary max-w-2xl mx-auto">
              Not another calendar app. A temporal reasoning engine that understands cycles 
              and respects your rules.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bentoFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`group relative overflow-hidden rounded-3xl p-8 glass border border-white/5 hover:border-white/10 transition-all duration-500 ${
                  feature.span === 2 ? 'md:col-span-2' : ''
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 ${feature.iconColor}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-watchman-text-secondary">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Preview Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-watchman-accent/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-md mb-4">See Your Pattern</h2>
            <p className="text-xl text-watchman-text-secondary max-w-2xl mx-auto">
              Day shifts. Night shifts. Off days. Leave. Everything color-coded and visible at a glance.
            </p>
          </motion.div>

          {/* Calendar Preview */}
          <motion.div
            className="glass rounded-3xl p-8 border border-white/10"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-work-day" />
                <span className="text-sm text-watchman-text-secondary">Day Shift</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-work-night" />
                <span className="text-sm text-watchman-text-secondary">Night Shift</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-work-off" />
                <span className="text-sm text-watchman-text-secondary">Off Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-commit-leave" />
                <span className="text-sm text-watchman-text-secondary">Leave</span>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs text-watchman-muted py-2">
                  {day}
                </div>
              ))}
              {/* Sample days - showing a 5-5-5 pattern */}
              {Array.from({ length: 28 }, (_, i) => {
                const cycleDay = i % 15;
                let type = 'day';
                if (cycleDay >= 5 && cycleDay < 10) type = 'night';
                else if (cycleDay >= 10) type = 'off';
                
                const colors = {
                  day: 'bg-work-day/30 border-work-day/50',
                  night: 'bg-work-night/30 border-work-night/50',
                  off: 'bg-work-off/30 border-work-off/50',
                };
                
                return (
                  <motion.div
                    key={i}
                    className={`aspect-square rounded-lg border ${colors[type as keyof typeof colors]} flex items-center justify-center text-sm`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {i + 1}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-md mb-4">How Watchman Works</h2>
            <p className="text-xl text-watchman-text-secondary">Four steps to controlled time.</p>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                className="flex gap-6 items-start group"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl glass border border-white/10 flex items-center justify-center group-hover:border-watchman-accent/30 group-hover:bg-watchman-accent/5 transition-all duration-300">
                  <span className="text-2xl font-bold text-gradient">{step.step}</span>
                </div>
                <div className="pt-2 flex-1">
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-3">
                    <step.icon className="w-5 h-5 text-watchman-accent" />
                    {step.title}
                  </h3>
                  <p className="text-watchman-text-secondary">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-md mb-4">Built For People With Structure</h2>
            <p className="text-xl text-watchman-text-secondary">Rotational workers. Students. Anyone with cycles.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.name}
                className="p-6 rounded-2xl glass border border-white/5 text-center hover:border-white/10 hover:bg-white/5 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="text-3xl mb-3">{industry.icon}</div>
                <h3 className="font-medium text-sm mb-1">{industry.name}</h3>
                <p className="text-xs text-watchman-muted">{industry.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-watchman-accent/10 via-transparent to-transparent" />
        
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-full bg-watchman-accent/10 border border-watchman-accent/20 flex items-center justify-center mx-auto mb-8">
              <Command className="w-10 h-10 text-watchman-accent" />
            </div>
            <h2 className="text-display-md mb-6">Start Watching Your Time</h2>
            <p className="text-xl text-watchman-text-secondary mb-10">
              Define your rules. Generate your year. Take control.
            </p>
            <Link href="/login">
              <Button variant="gradient" size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image 
              src="/watchman-logo.png" 
              alt="Watchman" 
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-semibold">Watchman</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-watchman-muted">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-watchman-muted">
            © {new Date().getFullYear()} Watchman. Time under control.
          </p>
        </div>
      </footer>
    </div>
  );
}
