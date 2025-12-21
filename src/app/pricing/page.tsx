'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Check, ArrowRight, Zap, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For individuals getting started with structured scheduling.',
    icon: Zap,
    features: [
      '1 year calendar',
      '1 rotation cycle',
      '2 commitments max',
      'Binary constraints',
      'Manual input only',
      'Basic statistics',
    ],
    limitations: [
      'No LLM parsing',
      'No email parsing',
      'Limited exports',
    ],
    cta: 'Get Started Free',
    variant: 'secondary' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$10',
    period: '/month',
    description: 'For professionals who need intelligent parsing and full control.',
    icon: Crown,
    features: [
      'Unlimited years',
      'Unlimited rotations',
      'Unlimited commitments',
      'Binary + weighted constraints',
      'LLM text parsing',
      'Email & PDF parsing',
      'Full statistics',
      'CSV & PDF exports',
      'Leave planning',
      'Email notifications',
      'Priority support',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    variant: 'primary' as const,
    popular: true,
  },
  {
    name: 'Team',
    price: 'Contact',
    period: 'us',
    description: 'For crews and teams with shared scheduling needs.',
    icon: Sparkles,
    features: [
      'Everything in Pro',
      'Team calendar view',
      'Crew rotation sync',
      'Admin dashboard',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    limitations: [],
    cta: 'Contact Sales',
    variant: 'secondary' as const,
    popular: false,
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
    question: 'What if I need more than what Pro offers?',
    answer: 'Contact us for Team or Enterprise plans. We can customize features, integrations, and support levels.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-watchman-bg text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-watchman-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-watchman-accent" />
            <span className="text-xl font-semibold">Watchman</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-watchman-muted hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Honest Pricing
            </h1>
            <p className="text-xl text-watchman-muted max-w-2xl mx-auto">
              Start free. Upgrade when you need intelligent parsing and full statistics.
              No hidden fees. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border ${
                  tier.popular
                    ? 'bg-watchman-accent/5 border-watchman-accent/30'
                    : 'bg-watchman-surface border-white/5'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-watchman-accent text-watchman-bg text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <tier.icon className={`w-10 h-10 mb-4 ${
                    tier.popular ? 'text-watchman-accent' : 'text-watchman-muted'
                  }`} />
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-watchman-muted">{tier.period}</span>
                  </div>
                  <p className="mt-4 text-sm text-watchman-muted">{tier.description}</p>
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
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-watchman-mint flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {tier.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-3 opacity-50">
                      <span className="w-5 h-5 flex items-center justify-center text-watchman-muted">—</span>
                      <span className="text-sm text-watchman-muted">{limitation}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Section */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            What&apos;s the difference?
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-8 text-watchman-muted font-medium">Feature</th>
                  <th className="text-center px-6 py-4 text-watchman-muted font-medium">Free</th>
                  <th className="text-center px-6 py-4 text-watchman-accent font-medium">Pro</th>
                  <th className="text-center px-6 py-4 text-watchman-muted font-medium">Team</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Calendar years', free: '1', pro: 'Unlimited', team: 'Unlimited' },
                  { feature: 'Rotation cycles', free: '1', pro: 'Unlimited', team: 'Unlimited' },
                  { feature: 'Commitments', free: '2', pro: 'Unlimited', team: 'Unlimited' },
                  { feature: 'LLM text parsing', free: '—', pro: '✓', team: '✓' },
                  { feature: 'Email/PDF parsing', free: '—', pro: '✓', team: '✓' },
                  { feature: 'Weighted constraints', free: '—', pro: '✓', team: '✓' },
                  { feature: 'Full statistics', free: '—', pro: '✓', team: '✓' },
                  { feature: 'Exports (CSV/PDF)', free: 'Limited', pro: '✓', team: '✓' },
                  { feature: 'Team calendar', free: '—', pro: '—', team: '✓' },
                  { feature: 'API access', free: '—', pro: '—', team: '✓' },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-white/5">
                    <td className="py-4 pr-8">{row.feature}</td>
                    <td className="text-center px-6 py-4 text-watchman-muted">{row.free}</td>
                    <td className="text-center px-6 py-4">{row.pro}</td>
                    <td className="text-center px-6 py-4 text-watchman-muted">{row.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 rounded-xl bg-watchman-surface border border-white/5"
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-watchman-muted leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="text-watchman-muted mb-8">
            Start with Free. Upgrade when you&apos;re ready. No pressure.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" className="gap-2">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-watchman-accent" />
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
