'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, ArrowRight, Zap, Crown, X, Sparkles, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For individuals getting started with structured scheduling.',
    icon: Zap,
    gradient: 'from-zinc-500 to-zinc-600',
    glow: 'shadow-zinc-500/20',
    features: [
      '6 months calendar planning',
      '1 rotation cycle',
      '2 commitments max',
      'Binary constraints only',
      'Manual input only',
      'Basic dashboard stats',
    ],
    limitations: [
      'No LLM parsing',
      'No PDF parsing',
      'No CSV/PDF exports',
    ],
    cta: 'Get Started Free',
    variant: 'glass' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$10',
    period: '/month',
    description: 'For professionals who need intelligent parsing and full control.',
    icon: Crown,
    gradient: 'from-watchman-accent to-watchman-purple',
    glow: 'shadow-watchman-accent/30',
    features: [
      'Unlimited years',
      'Unlimited rotations',
      'Unlimited commitments',
      'Binary + weighted constraints',
      'LLM text parsing (Gemini)',
      'PDF text extraction',
      'Full statistics & analytics',
      'CSV & PDF exports',
      'Leave planning',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    variant: 'gradient' as const,
    popular: true,
  },
];

const faqs = [
  {
    question: 'What is LLM text parsing?',
    answer: 'Paste any unstructured text (emails, WhatsApp messages, PDFs) and our AI will parse it into structured calendar changes. You always approve before anything applies.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes. Upgrade instantly, downgrade at the end of your billing period. No lock-in, no hidden fees.',
  },
  {
    question: 'What does "binary constraints" mean?',
    answer: 'Binary constraints are hard rules: allowed or not allowed. No exceptions. "No study on night shifts" is a binary constraint that the system will never break.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted at rest and in transit. We use Supabase with Row-Level Security. Your calendar is yours.',
  },
  {
    question: 'What if I need more features?',
    answer: 'Contact us if you need custom integrations or have specific requirements. We can discuss your needs.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-watchman-bg text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-watchman-accent/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-watchman-purple/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-bold tracking-tight">Watchman</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-watchman-muted hover:text-white transition-colors text-sm">
              Home
            </Link>
            <Link href="/login">
              <Button variant="gradient" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center mx-auto mb-8 shadow-xl shadow-watchman-accent/30"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, <span className="text-gradient">Honest</span> Pricing
            </h1>
            <p className="text-xl text-watchman-muted max-w-2xl mx-auto">
              Start free. Upgrade when you need intelligent parsing and full statistics.
              No hidden fees. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={cn(
                  'relative p-8 rounded-3xl border overflow-hidden',
                  tier.popular
                    ? 'glass-strong border-watchman-accent/30'
                    : 'glass border-white/10'
                )}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <div className="px-6 py-2 bg-gradient-to-r from-watchman-accent to-watchman-purple rounded-b-2xl shadow-lg shadow-watchman-accent/30">
                      <span className="text-sm font-semibold text-white">Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Glow Effect for Pro */}
                {tier.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-watchman-accent/5 to-watchman-purple/5 pointer-events-none" />
                )}

                <div className="relative mb-8 pt-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg',
                    tier.gradient,
                    tier.glow
                  )}>
                    <tier.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-5xl font-bold">{tier.price}</span>
                    <span className="text-watchman-muted text-lg">{tier.period}</span>
                  </div>
                  <p className="mt-4 text-sm text-watchman-muted leading-relaxed">{tier.description}</p>
                </div>

                <Link href="/login">
                  <Button
                    variant={tier.variant}
                    size="lg"
                    className="w-full gap-2 mb-8"
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <div className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </motion.div>
                  ))}
                  {tier.limitations.map((limitation, i) => (
                    <motion.div
                      key={limitation}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="flex items-start gap-3 opacity-50"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-watchman-muted" />
                      </div>
                      <span className="text-sm text-watchman-muted">{limitation}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Section */}
      <section className="relative py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-12"
          >
            Feature Comparison
          </motion.h2>
          
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-4 px-6 text-watchman-muted font-medium">Feature</th>
                  <th className="text-center px-6 py-4 text-watchman-muted font-medium">Free</th>
                  <th className="text-center px-6 py-4 font-medium">
                    <span className="text-gradient">Pro</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Calendar planning', free: '6 months', pro: 'Unlimited' },
                  { feature: 'Rotation cycles', free: '1', pro: 'Unlimited' },
                  { feature: 'Commitments', free: '2', pro: 'Unlimited' },
                  { feature: 'LLM text parsing', free: false, pro: true },
                  { feature: 'PDF parsing', free: false, pro: true },
                  { feature: 'Weighted constraints', free: false, pro: true },
                  { feature: 'Full statistics', free: false, pro: true },
                  { feature: 'Exports (CSV/PDF)', free: false, pro: true },
                  { feature: 'Leave planning', free: false, pro: true },
                ].map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-4 px-6">{row.feature}</td>
                    <td className="text-center px-6 py-4 text-watchman-muted">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="w-4 h-4 mx-auto text-emerald-400" /> : <span className="text-watchman-muted/50">—</span>
                      ) : row.free}
                    </td>
                    <td className="text-center px-6 py-4">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <Check className="w-4 h-4 mx-auto text-emerald-400" /> : <span className="text-watchman-muted/50">—</span>
                      ) : <span className="text-watchman-accent font-medium">{row.pro}</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-12"
          >
            Frequently Asked Questions
          </motion.h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="p-6 glass rounded-2xl border border-white/5"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-watchman-accent/10 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-watchman-accent" />
                  </div>
                  {faq.question}
                </h3>
                <p className="text-sm text-watchman-muted leading-relaxed pl-9">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center mx-auto mb-8">
              <Clock className="w-8 h-8 text-watchman-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
            <p className="text-watchman-muted mb-8 text-lg">
              Start with Free. Upgrade when you&apos;re ready. No pressure.
            </p>
            <Link href="/login">
              <Button variant="gradient" size="lg" className="gap-2 shadow-lg shadow-watchman-accent/30">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-semibold">Watchman</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-watchman-muted">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-watchman-muted">
            © {new Date().getFullYear()} Watchman
          </p>
        </div>
      </footer>
    </div>
  );
}
