'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-watchman-bg">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-watchman-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-watchman-muted">Last updated: December 2024</p>
            </div>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-8">

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  Welcome to Watchman ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our shift scheduling and life management application.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white">Account Information</h3>
                    <p className="text-watchman-text-secondary leading-relaxed">
                      When you create an account, we collect your email address, name, and authentication credentials through our secure authentication provider (Supabase).
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Schedule Data</h3>
                    <p className="text-watchman-text-secondary leading-relaxed">
                      We collect and store information about your work shifts, rotation patterns, anchor dates, and related scheduling preferences that you provide.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Commitments & Incidents</h3>
                    <p className="text-watchman-text-secondary leading-relaxed">
                      We store personal commitments, study goals, workplace incident reports, and daily logs that you choose to enter into the application.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Payment Information</h3>
                    <p className="text-watchman-text-secondary leading-relaxed">
                      For Pro subscriptions, payment processing is handled by Stripe. We do not store your full credit card numbers. We only receive and store a customer identifier to manage your subscription.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-watchman-text-secondary space-y-2">
                  <li>To provide and maintain our service</li>
                  <li>To generate your personalized shift calendar</li>
                  <li>To send you important notifications and updates (if enabled)</li>
                  <li>To process your subscription payments</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To improve and optimize our service</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing & Disclosure</h2>
                <p className="text-watchman-text-secondary leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-watchman-text-secondary space-y-2">
                  <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform (Supabase for database, Stripe for payments, Resend for emails)</li>
                  <li><strong>Calendar Sharing:</strong> If you choose to share your calendar via a share link, only the information you select will be visible to those with the link</li>
                  <li><strong>Legal Requirements:</strong> If required by law or to protect our rights and the safety of users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Data Security</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS/TLS) and at rest. Your data is stored on secure servers provided by Supabase. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or legitimate business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
                <p className="text-watchman-text-secondary leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-watchman-text-secondary space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
                <p className="text-watchman-text-secondary leading-relaxed mt-4">
                  You can exercise these rights through your account settings or by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. Cookies & Tracking</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We use essential cookies for authentication and session management. We do not use third-party tracking or advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">9. Children's Privacy</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  Watchman is not intended for use by anyone under the age of 16. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-watchman-accent mt-2">
                  support@trywatchman.app
                </p>
              </section>

            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <p className="text-watchman-muted text-sm">
              Watchman - Time under control.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/legal/terms" className="text-watchman-muted hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="text-watchman-accent">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
