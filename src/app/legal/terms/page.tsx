'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-watchman-muted">Last updated: December 2025</p>
            </div>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-8">

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  By accessing or using Watchman ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  Watchman is a shift scheduling and life management application designed to help users manage rotating work schedules, track commitments, and document workplace incidents. The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
                <div className="space-y-4 text-watchman-text-secondary">
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                  </p>
                  <p>
                    You agree to provide accurate and complete information when creating your account and to update your information as necessary.
                  </p>
                  <p>
                    You must be at least 16 years old to use the Service.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Subscription & Billing</h2>
                <div className="space-y-4 text-watchman-text-secondary">
                  <div>
                    <h3 className="font-medium text-white">Free Plan</h3>
                    <p>
                      The free plan provides access to core features including calendar generation, basic commitments tracking, and incident logging.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Pro Plan</h3>
                    <p>
                      The Pro plan is billed monthly and provides access to additional features including calendar sharing, PDF exports, weighted constraints, and priority support.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Payment</h3>
                    <p>
                      All payments are processed securely through Stripe. By subscribing to Pro, you authorize us to charge your payment method on a recurring basis until you cancel.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Cancellation</h3>
                    <p>
                      You may cancel your Pro subscription at any time through your account settings. Upon cancellation, you will retain access to Pro features until the end of your current billing period.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">5. Refund Policy</h2>
                <div className="space-y-4 text-watchman-text-secondary">
                  <p>
                    We offer refunds for Pro subscriptions under the following conditions:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Eligibility:</strong> Refund requests must be made within <span className="text-amber-400 font-semibold">7 days</span> of the initial subscription purchase or renewal.</li>
                    <li><strong>Process:</strong> To request a refund, contact us at support@trywatchman.app with your account email and reason for the refund.</li>
                    <li><strong>Exclusions:</strong> Refunds are not available for subscriptions older than 7 days, or if the account has been terminated for Terms of Service violations.</li>
                  </ul>
                  <p className="mt-4">
                    Approved refunds will be processed within 5-10 business days and returned to your original payment method.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Acceptable Use</h2>
                <p className="text-watchman-text-secondary leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside text-watchman-text-secondary space-y-2">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Upload malicious code or content</li>
                  <li>Scrape, data mine, or collect data from the Service without permission</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the Service to harass, abuse, or harm others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  The Service, including its design, features, and content (excluding user-generated content), is owned by Watchman and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. User Content</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  You retain ownership of all content you submit to the Service. By submitting content, you grant us a limited license to store, display, and process your content solely to provide the Service to you. We do not claim ownership of your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WATCHMAN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">11. Indemnification</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  You agree to indemnify and hold harmless Watchman and its founders, employees, and affiliates from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">12. Termination</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion. You may also terminate your account at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">13. Changes to Terms</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  We may update these Terms from time to time. We will notify you of significant changes by email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">14. Governing Law</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">15. Contact</h2>
                <p className="text-watchman-text-secondary leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
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
              <Link href="/legal/terms" className="text-watchman-accent">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="text-watchman-muted hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
