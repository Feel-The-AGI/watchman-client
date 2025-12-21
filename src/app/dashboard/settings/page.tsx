'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  CreditCard,
  Bell,
  Palette,
  Globe,
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

type SettingsTab = 'profile' | 'subscription' | 'notifications' | 'preferences' | 'danger';

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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(user?.email || '');
    }
  }, [profile, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, subRes] = await Promise.all([
        api.settings.get(),
        api.settings.getSubscription(),
      ]);
      setSettings(settingsRes);
      setSubscription(subRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
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

  const handleUpgrade = () => {
    window.open('/pricing', '_blank');
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await api.settings.getPortalUrl();
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

    const doubleConfirmed = confirm(
      'This will permanently delete all your data including calendar, commitments, and settings. Type DELETE to confirm.'
    );
    if (!doubleConfirmed) return;

    try {
      await api.settings.deleteAccount();
      await signOut();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
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

                      {subscription?.tier === 'pro' && (
                        <div className="mt-4 p-4 bg-watchman-bg rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-watchman-muted">
                                {subscription.cancel_at_period_end
                                  ? 'Your plan will end on'
                                  : 'Next billing date'}
                              </p>
                              <p className="font-medium">
                                {subscription.current_period_end
                                  ? new Date(subscription.current_period_end).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={handleManageSubscription}
                              className="gap-2"
                            >
                              Manage Billing
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Feature Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { feature: 'Calendar years', free: '1', pro: 'Unlimited' },
                          { feature: 'Rotation cycles', free: '1', pro: 'Unlimited' },
                          { feature: 'Commitments', free: '2', pro: 'Unlimited' },
                          { feature: 'LLM text parsing', free: '—', pro: '✓' },
                          { feature: 'Full statistics', free: '—', pro: '✓' },
                          { feature: 'Exports', free: 'Limited', pro: 'Full' },
                        ].map((row) => (
                          <div key={row.feature} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm">{row.feature}</span>
                            <div className="flex items-center gap-8">
                              <span className="text-sm text-watchman-muted w-20 text-center">{row.free}</span>
                              <span className="text-sm text-watchman-accent w-20 text-center">{row.pro}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
