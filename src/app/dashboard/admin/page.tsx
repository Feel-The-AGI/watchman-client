'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Globe,
  Activity,
  MessageSquare,
  Target,
  Calendar,
  AlertTriangle,
  Crown,
  Zap,
  RefreshCw,
  ChevronRight,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  Loader2,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AdminStats {
  generated_at: string;
  users: {
    total: number;
    free: number;
    pro: number;
    admin: number;
    onboarded: number;
    not_onboarded: number;
    onboarding_rate: number;
    dormant: number;
  };
  signups: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    this_quarter: number;
  };
  activity: {
    active_today: number;
    active_this_week: number;
    active_this_month: number;
    dau: number;
    wau: number;
    mau: number;
  };
  revenue: {
    total_usd: number;
    this_month_usd: number;
    this_quarter_usd: number;
    mrr: number;
    arr: number;
    arppu: number;
  };
  conversion: {
    overall_rate: number;
    onboarded_rate: number;
    total_payments: number;
  };
  growth: {
    wow_percent: number;
    mom_percent: number;
  };
  engagement: {
    total_chat_messages: number;
    total_commitments: number;
    total_incidents: number;
    avg_messages_per_user: number;
  };
  geography: {
    top_countries: { country: string; count: number }[];
    unique_countries: number;
  };
  recent_users: any[];
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'accent'
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'accent' | 'mint' | 'purple' | 'amber' | 'red';
}) {
  const colorClasses = {
    accent: 'from-watchman-accent/20 to-watchman-accent/5 text-watchman-accent',
    mint: 'from-watchman-mint/20 to-watchman-mint/5 text-watchman-mint',
    purple: 'from-watchman-purple/20 to-watchman-purple/5 text-watchman-purple',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500',
    red: 'from-red-500/20 to-red-500/5 text-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center',
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-watchman-mint/20 text-watchman-mint' :
            trend === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-white/10 text-watchman-muted'
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-watchman-muted">{title}</div>
      {subtitle && <div className="text-xs text-watchman-muted/60 mt-1">{subtitle}</div>}
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await api.admin.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.tier !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    }
  }, [authLoading, profile, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-watchman-accent" />
      </div>
    );
  }

  if (profile?.tier !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
        <p className="text-watchman-muted mb-4">{error}</p>
        <Button variant="primary" onClick={fetchStats}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-watchman-accent" />
            Admin Dashboard
          </h1>
          <p className="text-watchman-muted mt-1">
            Last updated: {new Date(stats.generated_at).toLocaleString()}
          </p>
        </div>
        <Button 
          variant="glass" 
          onClick={fetchStats} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          icon={Users}
          color="accent"
          trend={stats.growth.wow_percent > 0 ? 'up' : stats.growth.wow_percent < 0 ? 'down' : 'neutral'}
          trendValue={`${stats.growth.wow_percent > 0 ? '+' : ''}${stats.growth.wow_percent}% WoW`}
        />
        <StatCard
          title="Pro Users"
          value={stats.users.pro}
          subtitle={`${stats.conversion.overall_rate}% conversion`}
          icon={Crown}
          color="purple"
        />
        <StatCard
          title="MRR"
          value={`$${stats.revenue.mrr}`}
          subtitle={`ARR: $${stats.revenue.arr}`}
          icon={DollarSign}
          color="mint"
        />
        <StatCard
          title="DAU / MAU"
          value={`${stats.activity.dau} / ${stats.activity.mau}`}
          subtitle="Daily / Monthly Active"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Signups & Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-watchman-accent" />
              Signups
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-watchman-accent">{stats.signups.today}</div>
              <div className="text-sm text-watchman-muted">Today</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-white">{stats.signups.yesterday}</div>
              <div className="text-sm text-watchman-muted">Yesterday</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-white">{stats.signups.this_week}</div>
              <div className="text-sm text-watchman-muted">This Week</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-white">{stats.signups.this_month}</div>
              <div className="text-sm text-watchman-muted">This Month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-watchman-mint" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-watchman-mint">{stats.activity.active_today}</div>
              <div className="text-sm text-watchman-muted">Active Today</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-white">{stats.activity.active_this_week}</div>
              <div className="text-sm text-watchman-muted">This Week</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-white">{stats.activity.active_this_month}</div>
              <div className="text-sm text-watchman-muted">This Month</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl">
              <div className="text-3xl font-bold text-red-400">{stats.users.dormant}</div>
              <div className="text-sm text-watchman-muted">Dormant (30d+)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Breakdown & Conversion */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-watchman-accent" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-400" />
                <span className="text-sm">Free</span>
              </div>
              <span className="font-bold">{stats.users.free}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-watchman-purple" />
                <span className="text-sm">Pro</span>
              </div>
              <span className="font-bold text-watchman-purple">{stats.users.pro}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-watchman-mint" />
                <span className="text-sm">Admin</span>
              </div>
              <span className="font-bold text-watchman-mint">{stats.users.admin}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-watchman-purple" />
              Conversion & Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">Onboarding Rate</span>
              <span className="font-bold text-watchman-mint">{stats.users.onboarding_rate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">Free → Pro Conversion</span>
              <span className="font-bold text-watchman-purple">{stats.conversion.overall_rate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">Onboarded → Pro</span>
              <span className="font-bold">{stats.conversion.onboarded_rate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">Total Payments</span>
              <span className="font-bold text-watchman-accent">{stats.conversion.total_payments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-watchman-mint" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">Total Revenue</span>
              <span className="font-bold text-watchman-mint">${stats.revenue.total_usd}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">This Month</span>
              <span className="font-bold">${stats.revenue.this_month_usd}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl">
              <span className="text-sm">ARPPU</span>
              <span className="font-bold">${stats.revenue.arppu}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Geography */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-watchman-accent" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-watchman-bg rounded-xl text-center">
              <div className="text-3xl font-bold text-watchman-accent">{stats.engagement.total_chat_messages}</div>
              <div className="text-sm text-watchman-muted">Chat Messages</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl text-center">
              <div className="text-3xl font-bold text-watchman-purple">{stats.engagement.total_commitments}</div>
              <div className="text-sm text-watchman-muted">Commitments</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl text-center">
              <div className="text-3xl font-bold text-amber-500">{stats.engagement.total_incidents}</div>
              <div className="text-sm text-watchman-muted">Incidents</div>
            </div>
            <div className="p-4 bg-watchman-bg rounded-xl text-center">
              <div className="text-3xl font-bold text-white">{stats.engagement.avg_messages_per_user}</div>
              <div className="text-sm text-watchman-muted">Avg Msgs/User</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-watchman-mint" />
              Geography ({stats.geography.unique_countries} countries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stats.geography.top_countries.map((country, index) => (
                <div 
                  key={country.country}
                  className="flex items-center justify-between p-3 bg-watchman-bg rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-watchman-muted text-sm">#{index + 1}</span>
                    <MapPin className="w-4 h-4 text-watchman-accent" />
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <span className="font-bold">{country.count}</span>
                </div>
              ))}
              {stats.geography.top_countries.length === 0 && (
                <div className="text-center text-watchman-muted py-4">
                  No location data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-watchman-accent" />
            Recent Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-watchman-muted text-sm border-b border-white/10">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Tier</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Onboarded</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                        <div className="text-xs text-watchman-muted">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        user.tier === 'pro' ? 'bg-watchman-purple/20 text-watchman-purple' :
                        user.tier === 'admin' ? 'bg-watchman-mint/20 text-watchman-mint' :
                        'bg-white/10 text-watchman-muted'
                      )}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      {user.city && user.country ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-watchman-muted" />
                          {user.city}, {user.country_code || user.country}
                        </span>
                      ) : (
                        <span className="text-watchman-muted">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {user.onboarding_completed ? (
                        <UserCheck className="w-4 h-4 text-watchman-mint" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-400" />
                      )}
                    </td>
                    <td className="py-3 text-sm text-watchman-muted">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 text-sm text-watchman-muted">
                      {user.last_active ? new Date(user.last_active).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Week-over-Week Growth"
          value={`${stats.growth.wow_percent > 0 ? '+' : ''}${stats.growth.wow_percent}%`}
          icon={TrendingUp}
          color={stats.growth.wow_percent >= 0 ? 'mint' : 'red'}
        />
        <StatCard
          title="Month-over-Month Growth"
          value={`${stats.growth.mom_percent > 0 ? '+' : ''}${stats.growth.mom_percent}%`}
          icon={TrendingUp}
          color={stats.growth.mom_percent >= 0 ? 'mint' : 'red'}
        />
        <StatCard
          title="Not Onboarded"
          value={stats.users.not_onboarded}
          subtitle="Users who haven't completed setup"
          icon={UserX}
          color="amber"
        />
        <StatCard
          title="Quarterly Signups"
          value={stats.signups.this_quarter}
          subtitle="Last 90 days"
          icon={Calendar}
          color="accent"
        />
      </div>
    </div>
  );
}
