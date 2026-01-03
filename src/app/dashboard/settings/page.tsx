'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  CreditCard,
  Bell,
  Palette,
  Mail,
  Smartphone,
  Trash2,
  LogOut,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Crown,
  Zap,
  ExternalLink,
  Star,
  Share2,
  Copy,
  Link,
  Eye,
  EyeOff,
  Plus,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Celebration } from '@/components/ui/Celebration';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserSettings {
  timezone: string;
  notifications_email: boolean;
  notifications_push: boolean;
  theme: 'dark' | 'light' | 'system';
  weighted_mode: boolean;
}

interface Subscription {
  tier: 'free' | 'pro' | 'admin';
  status: 'active' | 'cancelled' | 'past_due';
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

type SettingsTab = 'profile' | 'subscription' | 'sharing' | 'notifications' | 'preferences' | 'danger';

interface CalendarShare {
  id: string;
  share_code: string;
  name: string;
  share_url: string;
  is_active: boolean;
  show_commitments: boolean;
  show_work_types: boolean;
  created_at: string;
  view_count: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    timezone: 'UTC',
    notifications_email: true,
    notifications_push: false,
    theme: 'dark',
    weighted_mode: false,
  });
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Sharing states
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [creatingShare, setCreatingShare] = useState(false);
  const [shareName, setShareName] = useState('My Shared Calendar');
  const [showCommitments, setShowCommitments] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [newlyCreatedShare, setNewlyCreatedShare] = useState<CalendarShare | null>(null);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Cancel subscription modal
  const [cancelSubscriptionModal, setCancelSubscriptionModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Confirmation modal states
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [revokeShareModal, setRevokeShareModal] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Test email state
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Payment history state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<{
    usd_price: number;
    ghs_amount: number;
    exchange_rate: number;
    display_ghs: string;
  } | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(user?.email || '');
    }
  }, [profile, user]);

  // Trigger celebration for Pro users who haven't seen it yet
  useEffect(() => {
    if (subscription && (subscription.tier === 'pro' || subscription.tier === 'admin')) {
      const celebrationKey = `watchman_pro_celebration_${user?.id || 'user'}`;
      const hasSeenCelebration = localStorage.getItem(celebrationKey);

      if (!hasSeenCelebration) {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
          setShowCelebration(true);
          localStorage.setItem(celebrationKey, 'true');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [subscription, user?.id]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both in parallel, handle failures gracefully
      const [settingsRes, subRes] = await Promise.allSettled([
        api.settings.get(),
        api.settings.getSubscription(),
      ]);
      
      // Handle settings response
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setSettings({
          timezone: settingsRes.value?.settings?.timezone || 'UTC',
          notifications_email: settingsRes.value?.settings?.notifications_email ?? true,
          notifications_push: settingsRes.value?.settings?.notifications_push ?? false,
          theme: settingsRes.value?.settings?.theme || 'dark',
          weighted_mode: settingsRes.value?.settings?.weighted_mode_enabled ?? false,
        });
      }
      
      // Handle subscription response
      if (subRes.status === 'fulfilled' && subRes.value) {
        setSubscription({
          tier: subRes.value?.tier || profile?.tier || 'free',
          status: subRes.value?.subscription?.status || 'active',
          current_period_end: subRes.value?.subscription?.current_period_end,
          cancel_at_period_end: subRes.value?.subscription?.cancel_at_period_end,
        });
      } else {
        // Default subscription
        setSubscription({
          tier: profile?.tier || 'free',
          status: 'active',
        });
      }
    } catch (err: any) {
      console.error('Settings fetch error:', err);
      // Don't show error for 404s
      if (err.status !== 404) {
        setError(err.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.settings.updateProfile({ name });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.settings.update(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    // Show upgrade modal and fetch pricing
    setShowUpgradeModal(true);
    setLoadingPricing(true);
    try {
      const pricing = await api.payments.getPricing();
      setPricingInfo(pricing);
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
      // Use fallback pricing
      setPricingInfo({
        usd_price: 12,
        ghs_amount: 174,
        exchange_rate: 14.5,
        display_ghs: 'GHS 174.00',
      });
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleProceedToCheckout = async () => {
    try {
      setUpgrading(true);
      setError(null);
      const result = await api.payments.createCheckout();
      if (result.checkout_url) {
        // Redirect to Paystack checkout
        window.location.href = result.checkout_url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    // Paystack doesn't have a billing portal like Stripe
    // Users manage subscriptions via email or cancellation
    setActiveTab('subscription');
    setSuccess('Subscription management: You can cancel your subscription below, or check your email from Paystack for payment method updates.');
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleCancelSubscription = () => {
    setCancelSubscriptionModal(true);
  };

  const confirmCancelSubscription = async () => {
    try {
      setCancellingSubscription(true);
      await api.payments.cancelSubscription();
      setSubscription({ ...subscription!, tier: 'free' });
      setSuccess('Your subscription has been cancelled. You will retain Pro access until the end of your billing period.');
      setCancelSubscriptionModal(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await api.settings.deleteAccount();
      await signOut();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleteAccountModal(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  // Sharing functions
  const fetchShares = async () => {
    try {
      const sharesData = await api.sharing.list();
      // API wrapper already unwraps { success, data } responses
      setShares(Array.isArray(sharesData) ? sharesData : []);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    }
  };

  const handleCreateShare = async () => {
    try {
      setCreatingShare(true);
      // API wrapper already unwraps { success, data } responses, so we get the share object directly
      const createdShare = await api.sharing.create({
        name: shareName,
        show_commitments: showCommitments,
        show_work_types: true,
      });
      if (createdShare && createdShare.id) {
        setShares([createdShare, ...shares]);
        setNewlyCreatedShare(createdShare);
        setShareName('My Shared Calendar');
        setShowCommitments(false);
        // Auto-copy to clipboard
        const fullUrl = `${window.location.origin}${createdShare.share_url}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedShareId(createdShare.id);
        setSuccess('Share link created and copied!');
        setTimeout(() => {
          setSuccess(null);
          setCopiedShareId(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleRevokeShare = (shareId: string) => {
    setRevokeShareModal(shareId);
  };

  const confirmRevokeShare = async () => {
    if (!revokeShareModal) return;
    try {
      await api.sharing.revoke(revokeShareModal);
      setShares(shares.filter(s => s.id !== revokeShareModal));
      setSuccess('Share link revoked');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share');
    } finally {
      setRevokeShareModal(null);
    }
  };

  const copyShareLink = (share: CalendarShare) => {
    const fullUrl = `${window.location.origin}${share.share_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedShareId(share.id);
    setTimeout(() => setCopiedShareId(null), 2000);
  };

  const handleTestEmail = async () => {
    try {
      setSendingTestEmail(true);
      setError(null);
      const result = await api.settings.testEmail();
      setSuccess(result.message || 'Test email sent successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Fetch shares when switching to sharing tab
  useEffect(() => {
    if (activeTab === 'sharing') {
      fetchShares();
    }
  }, [activeTab]);

  // Fetch payment history when switching to subscription tab
  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const result = await api.payments.getHistory();
      setPayments(result.payments || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscription' && (subscription?.tier === 'pro' || subscription?.tier === 'admin')) {
      fetchPayments();
    }
  }, [activeTab, subscription?.tier]);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
    { id: 'sharing' as const, label: 'Sharing', icon: Share2, isPro: true },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle },
  ];

  const timezones = [
    'UTC',
    'Africa/Johannesburg',
    'Africa/Accra',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Pro Celebration Animation */}
      <Celebration
        isActive={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-watchman-muted">
          Manage your account and preferences
        </p>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-watchman-error flex-shrink-0" />
          <p className="text-sm text-watchman-error">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6 p-4 rounded-xl bg-watchman-mint/10 border border-watchman-mint/20 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-watchman-mint" />
          <p className="text-sm text-watchman-mint">{success}</p>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="bg-watchman-surface rounded-xl border border-white/5 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-watchman-accent/10 text-watchman-accent'
                    : 'text-watchman-muted hover:text-white hover:bg-white/5',
                  tab.id === 'danger' && 'text-watchman-error hover:text-watchman-error'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                    <Input
                      label="Email"
                      value={email}
                      disabled
                      helper="Email cannot be changed"
                    />
                    <div className="pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-watchman-bg rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            subscription?.tier === 'admin' ? 'bg-watchman-mint' :
                            subscription?.tier === 'pro' ? 'bg-watchman-accent' : 'bg-white/10'
                          )}>
                            {subscription?.tier === 'admin' ? (
                              <Star className="w-6 h-6 text-white" />
                            ) : subscription?.tier === 'pro' ? (
                              <Crown className="w-6 h-6 text-white" />
                            ) : (
                              <Zap className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold capitalize">
                              {subscription?.tier || 'Free'} Plan
                            </h3>
                            <p className="text-sm text-watchman-muted">
                              {subscription?.tier === 'admin' && 'Full access with admin privileges'}
                              {subscription?.tier === 'pro' && 'All features unlocked'}
                              {subscription?.tier === 'free' && 'Basic features included'}
                            </p>
                          </div>
                        </div>
                        
                        {subscription?.tier === 'free' && (
                          <Button variant="primary" onClick={handleUpgrade} className="gap-2">
                            <Crown className="w-4 h-4" />
                            Upgrade to Pro
                          </Button>
                        )}
                      </div>

                      {subscription?.tier === 'admin' && (
                        <div className="mt-4 p-4 bg-watchman-mint/10 rounded-xl border border-watchman-mint/20">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-watchman-mint" />
                            <p className="font-medium text-watchman-mint">Lifetime Admin Access</p>
                          </div>
                          <p className="text-sm text-watchman-muted mt-1">
                            You have permanent access to all features.
                          </p>
                        </div>
                      )}

                      {subscription?.tier === 'pro' && subscription.current_period_end && (
                        <div className="mt-4 p-4 bg-watchman-bg rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-watchman-muted">
                                {subscription.cancel_at_period_end
                                  ? 'Your plan will end on'
                                  : 'Next billing date'}
                              </p>
                              <p className="font-medium">
                                {new Date(subscription.current_period_end).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={handleCancelSubscription}
                              className="gap-2 text-watchman-error hover:text-watchman-error hover:bg-watchman-error/10"
                            >
                              Cancel Subscription
                            </Button>
                          </div>
                        </div>
                      )}

                      {subscription?.tier === 'pro' && !subscription.current_period_end && (
                        <div className="mt-4 space-y-4">
                          <div className="p-4 bg-watchman-accent/10 rounded-xl border border-watchman-accent/20">
                            <div className="flex items-center gap-2">
                              <Crown className="w-5 h-5 text-watchman-accent" />
                              <p className="font-medium text-watchman-accent">Pro Access Active</p>
                            </div>
                            <p className="text-sm text-watchman-muted mt-1">
                              Your Pro subscription is active. Manage your payment through emails from Paystack.
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={handleCancelSubscription}
                            className="gap-2 text-watchman-error hover:text-watchman-error hover:bg-watchman-error/10"
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Feature Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Features</CardTitle>
                      <CardDescription>Compare what you get with each plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="text-sm font-medium">Feature</span>
                          <div className="flex items-center gap-8">
                            <span className="text-sm font-medium text-watchman-muted w-24 text-center">Free</span>
                            <span className="text-sm font-medium text-watchman-accent w-24 text-center">Pro</span>
                          </div>
                        </div>
                        {[
                          { feature: 'Calendar planning', free: '6 months', pro: 'Unlimited' },
                          { feature: 'Rotation cycles', free: '1', pro: 'Unlimited' },
                          { feature: 'Commitments', free: '2', pro: 'Unlimited' },
                          { feature: 'Watchman Agent', free: '100/mo', pro: 'Unlimited' },
                          { feature: 'Weighted constraints', free: '—', pro: '✓' },
                          { feature: 'Leave planning', free: '—', pro: '✓' },
                          { feature: 'CSV/PDF exports', free: '—', pro: '✓' },
                          { feature: 'Calendar sharing', free: '—', pro: '✓' },
                          { feature: '3-day Pro trial', free: '✓', pro: '—' },
                        ].map((row) => (
                          <div key={row.feature} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm">{row.feature}</span>
                            <div className="flex items-center gap-8">
                              <span className="text-sm text-watchman-muted w-24 text-center">{row.free}</span>
                              <span className="text-sm text-watchman-accent w-24 text-center">{row.pro}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History - Only show for Pro/Admin users */}
                  {(subscription?.tier === 'pro' || subscription?.tier === 'admin') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-watchman-accent" />
                          Payment History
                        </CardTitle>
                        <CardDescription>Your subscription payment records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingPayments ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-watchman-accent" />
                          </div>
                        ) : payments.length > 0 ? (
                          <div className="space-y-3">
                            {payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-4 bg-watchman-bg rounded-xl"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-watchman-accent/10 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-watchman-accent" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {payment.description || 'Pro Subscription'}
                                    </p>
                                    <p className="text-sm text-watchman-muted">
                                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-watchman-mint">
                                    ${(payment.amount).toFixed(2)} {payment.currency.toUpperCase()}
                                  </p>
                                  <p className="text-xs text-watchman-muted capitalize">
                                    {payment.status}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Receipt className="w-12 h-12 mx-auto text-watchman-muted/30 mb-3" />
                            <p className="text-watchman-muted">No payment records yet</p>
                            <p className="text-sm text-watchman-muted/70 mt-1">
                              Your payment history will appear here after your first billing cycle
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ToggleOption
                      icon={<Mail className="w-5 h-5" />}
                      title="Email Notifications"
                      description="Receive weekly summaries and important updates"
                      checked={settings.notifications_email}
                      onChange={(checked) => setSettings({ ...settings, notifications_email: checked })}
                    />
                    <ToggleOption
                      icon={<Smartphone className="w-5 h-5" />}
                      title="Push Notifications"
                      description="Get real-time alerts on your device"
                      checked={settings.notifications_push}
                      onChange={(checked) => setSettings({ ...settings, notifications_push: checked })}
                    />

                    {/*
                      TEST EMAIL SECTION - Commented out for production
                      Uncomment this section when you need to test email notifications

                    {settings.notifications_email && (
                      <div className="mt-4 p-4 bg-watchman-bg rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Test Email Notifications</p>
                            <p className="text-xs text-watchman-muted mt-1">
                              Send a test email to verify notifications work
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleTestEmail}
                            disabled={sendingTestEmail}
                            className="gap-2"
                          >
                            {sendingTestEmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Send Test
                          </Button>
                        </div>
                      </div>
                    )}
                    */}

                    <div className="pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <Card>
                  <CardHeader>
                    <CardTitle>App Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full px-4 py-3 bg-watchman-bg border border-white/10 rounded-xl focus:border-watchman-accent focus:outline-none"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Theme</label>
                      <div className="flex gap-2">
                        {(['dark', 'light', 'system'] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setSettings({ ...settings, theme })}
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-colors',
                              settings.theme === theme
                                ? 'bg-watchman-accent/10 border-watchman-accent text-watchman-accent'
                                : 'border-white/10 text-watchman-muted hover:border-white/20'
                            )}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ToggleOption
                      icon={<Settings className="w-5 h-5" />}
                      title="Weighted Mode"
                      description="Enable weighted constraints for flexible scheduling"
                      checked={settings.weighted_mode}
                      onChange={(checked) => setSettings({ ...settings, weighted_mode: checked })}
                    />

                    <div className="pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sharing Tab */}
              {activeTab === 'sharing' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-watchman-accent" />
                      Calendar Sharing
                    </CardTitle>
                    <CardDescription>
                      Share your calendar with others. They can view your schedule without needing an account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Check if user has Pro access */}
                    {profile?.tier === 'free' && (
                      <div className="p-4 rounded-xl bg-watchman-accent/5 border border-watchman-accent/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Crown className="w-5 h-5 text-watchman-accent" />
                          <span className="font-medium">Pro Feature</span>
                        </div>
                        <p className="text-sm text-watchman-muted mb-4">
                          Calendar sharing is available for Pro users. Share your schedule with family, friends, or colleagues.
                        </p>
                        <Button variant="gradient" size="sm" onClick={handleUpgrade}>
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}

                    {profile?.tier !== 'free' && (
                      <>
                        {/* Create new share */}
                        <div className="p-4 rounded-xl bg-watchman-bg">
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Share Link
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-watchman-muted mb-2 block">Share Name</label>
                              <Input
                                value={shareName}
                                onChange={(e) => setShareName(e.target.value)}
                                placeholder="My Shared Calendar"
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                              <div className="flex items-center gap-3">
                                {showCommitments ? (
                                  <Eye className="w-5 h-5 text-watchman-muted" />
                                ) : (
                                  <EyeOff className="w-5 h-5 text-watchman-muted" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">Show Commitments</p>
                                  <p className="text-xs text-watchman-muted">Include commitment names in shared view</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowCommitments(!showCommitments)}
                                className={cn(
                                  'relative w-12 h-6 rounded-full transition-colors',
                                  showCommitments ? 'bg-watchman-accent' : 'bg-white/10'
                                )}
                              >
                                <motion.div
                                  animate={{ x: showCommitments ? 24 : 4 }}
                                  className="absolute top-1 w-4 h-4 rounded-full bg-white"
                                />
                              </button>
                            </div>
                            {newlyCreatedShare ? (
                              <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="font-medium text-emerald-400">Link Created!</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-watchman-bg rounded-lg">
                                    <input
                                      type="text"
                                      readOnly
                                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}${newlyCreatedShare.share_url}`}
                                      className="flex-1 bg-transparent text-sm text-white/80 outline-none"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyShareLink(newlyCreatedShare)}
                                      className="gap-1 shrink-0"
                                    >
                                      {copiedShareId === newlyCreatedShare.id ? (
                                        <>
                                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                                          <span className="text-emerald-400">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          Copy
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <Button
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => setNewlyCreatedShare(null)}
                                >
                                  Create Another
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="gradient"
                                className="w-full gap-2"
                                onClick={handleCreateShare}
                                disabled={creatingShare}
                              >
                                {creatingShare ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Link className="w-4 h-4" />
                                )}
                                Create Share Link
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Existing shares */}
                        {shares.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Active Share Links</h4>
                            {shares.map((share) => (
                              <div
                                key={share.id}
                                className="p-4 rounded-xl bg-watchman-bg flex items-center justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{share.name}</p>
                                  <p className="text-xs text-watchman-muted mt-1">
                                    {share.view_count} views • Created {new Date(share.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyShareLink(share)}
                                    className="gap-1"
                                  >
                                    {copiedShareId === share.id ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeShare(share.id)}
                                    className="text-watchman-error hover:text-watchman-error hover:bg-watchman-error/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {shares.length === 0 && (
                          <p className="text-center text-watchman-muted py-8">
                            No share links yet. Create one above to share your calendar.
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <Card className="border-watchman-error/20">
                  <CardHeader>
                    <CardTitle className="text-watchman-error">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions that affect your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-watchman-error/5 rounded-xl border border-watchman-error/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-watchman-error">Delete Account</h4>
                          <p className="text-sm text-watchman-muted mt-1">
                            Permanently delete your account and all associated data. 
                            This action cannot be undone.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={handleDeleteAccount}
                          className="text-watchman-error hover:bg-watchman-error/10 gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-watchman-bg rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">Sign Out</h4>
                          <p className="text-sm text-watchman-muted mt-1">
                            Sign out of your account on this device.
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={signOut}
                          className="gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteAccountModal}
        onClose={() => setDeleteAccountModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account?"
        message={
          <div className="space-y-2">
            <p>This action <strong>cannot be undone</strong>.</p>
            <p className="text-xs text-watchman-muted">
              All your data including calendar, commitments, incidents, and settings will be permanently deleted.
            </p>
          </div>
        }
        confirmText="Delete My Account"
        variant="danger"
        loading={deletingAccount}
      />

      {/* Revoke Share Link Confirmation Modal */}
      <ConfirmModal
        isOpen={!!revokeShareModal}
        onClose={() => setRevokeShareModal(null)}
        onConfirm={confirmRevokeShare}
        title="Revoke Share Link?"
        message="Anyone with this link will no longer be able to view your calendar."
        confirmText="Revoke Link"
        variant="warning"
      />

      {/* Cancel Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelSubscriptionModal}
        onClose={() => setCancelSubscriptionModal(false)}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription?"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to cancel your Pro subscription?</p>
            <p className="text-xs text-watchman-muted">
              You will retain access to Pro features until the end of your current billing period.
            </p>
          </div>
        }
        confirmText="Cancel Subscription"
        variant="warning"
        loading={cancellingSubscription}
      />

      {/* Upgrade to Pro Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !upgrading && setShowUpgradeModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md mx-4 p-6 rounded-2xl bg-watchman-surface border border-white/10 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center mx-auto mb-4 shadow-lg shadow-watchman-accent/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
              <p className="text-watchman-muted mt-2">Unlock all features and unlimited access</p>
            </div>

            {loadingPricing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-watchman-accent" />
              </div>
            ) : (
              <>
                <div className="bg-watchman-bg rounded-xl p-4 mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold">${pricingInfo?.usd_price || 12}</span>
                    <span className="text-watchman-muted">/month</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    'Unlimited calendar years',
                    'Unlimited rotations & commitments',
                    'Unlimited Watchman AI agent',
                    'Weighted constraints',
                    'CSV & PDF exports',
                    'Calendar sharing',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-watchman-mint" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="glass"
                    className="flex-1"
                    onClick={() => setShowUpgradeModal(false)}
                    disabled={upgrading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1 gap-2"
                    onClick={handleProceedToCheckout}
                    disabled={upgrading}
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Subscribe Now
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-watchman-muted mt-4">
                  Secure payment via Paystack. Cancel anytime.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Toggle Option Component
interface ToggleOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ icon, title, description, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-watchman-bg rounded-xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-watchman-muted">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-watchman-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-14 h-8 rounded-full transition-colors',
          checked ? 'bg-watchman-accent' : 'bg-white/10'
        )}
      >
        <motion.div
          animate={{ x: checked ? 24 : 4 }}
          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
        />
      </button>
    </div>
  );
}
