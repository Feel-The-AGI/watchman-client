'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, BarChart3, Lock, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const features = [
  {
    icon: Calendar,
    title: 'Rule-Driven Scheduling',
    description: 'Define your rotation once. Watch 365 days generate automatically. No manual entry, ever.',
  },
  {
    icon: Lock,
    title: 'Approval-First Changes',
    description: 'Nothing mutates without your explicit approval. Every change is proposed, explained, then you decide.',
  },
  {
    icon: BarChart3,
    title: 'Complete Statistics',
    description: 'Total work days, off days, study hours, peak weeks. Know your year at a glance.',
  },
  {
    icon: Lock,
    title: 'Binary Constraints',
    description: 'Set hard rules. No studying on night shifts. Max 2 commitments. The system respects boundaries.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Define Your Cycle',
    description: 'Set your rotation pattern and anchor date. "10 days on, 5 nights, 10 off. Jan 1 = Day 4."',
  },
  {
    step: '02',
    title: 'Add Constraints',
    description: 'Binary rules that never break. "No study on night shifts." "Max 2 active commitments."',
  },
  {
    step: '03',
    title: 'Paste Any Change',
    description: 'Email, WhatsApp, PDF text. The system parses and proposes. You review before anything applies.',
  },
  {
    step: '04',
    title: 'Live With Clarity',
    description: 'Statistics update in real-time. Undo anytime. Your year becomes visible and controlled.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-watchman-bg text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-watchman-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-watchman-muted hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-watchman-accent/10 border border-watchman-accent/20 mb-8">
              <Zap className="w-4 h-4 text-watchman-accent" />
              <span className="text-sm text-watchman-accent">Deterministic Life-State Simulator</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">Time Under</span>
              <br />
              <span className="text-watchman-accent">Control</span>
            </h1>
            
            <p className="text-xl text-watchman-muted mb-8 max-w-2xl mx-auto leading-relaxed">
              A rule-driven calendar that simulates your year before committing to it. 
              No auto-planning. No silent decisions. Every change is proposed. You decide.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="primary" size="lg" className="gap-2">
                  Create Your Year
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Banner */}
      <section className="py-12 px-6 border-y border-white/5 bg-watchman-surface/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-watchman-muted italic">
            "Guard your hours. Live by rule, not noise."
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Built for Real Constraints</h2>
            <p className="text-watchman-muted max-w-2xl mx-auto">
              Not another calendar app. A temporal reasoning engine that understands cycles, 
              respects rules, and never mutates without permission.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-watchman-surface border border-white/5 hover:border-watchman-accent/20 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-watchman-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-watchman-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-watchman-surface/30 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">How Watchman Works</h2>
            <p className="text-watchman-muted">Four steps to controlled time.</p>
          </motion.div>

          <div className="space-y-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-watchman-accent/10 border border-watchman-accent/20 flex items-center justify-center">
                  <span className="text-watchman-accent font-bold text-lg">{step.step}</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-watchman-muted">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Built For People With Structure</h2>
            <p className="text-watchman-muted">Rotational workers. Students. Anyone with cycles.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Mining Engineers', desc: 'Shift rotations, crew schedules, leave planning' },
              { title: 'Healthcare Workers', desc: 'Nursing shifts, recovery days, study blocks' },
              { title: 'Working Students', desc: 'Balance education with job constraints' },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-watchman-surface border border-white/5 text-center"
              >
                <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-watchman-muted">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Clock className="w-16 h-16 text-watchman-accent mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Start Watching Your Time</h2>
            <p className="text-watchman-muted mb-8">
              Define your rules. Generate your year. Take control.
            </p>
            <Link href="/login">
              <Button variant="primary" size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
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
