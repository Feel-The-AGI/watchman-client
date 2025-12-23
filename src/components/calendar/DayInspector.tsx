'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Sun, 
  Moon, 
  Coffee, 
  Plane, 
  BookOpen, 
  Clock,
  AlertCircle,
  X,
  Edit2,
  Calendar,
  Sparkles,
  GraduationCap,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CalendarDay } from './CalendarGrid';

interface DayInspectorProps {
  date: Date;
  dayData: CalendarDay | null;
  onClose: () => void;
  onAddCommitment?: () => void;
  onAddLeave?: () => void;
  onEditDay?: () => void;
}

const workTypeInfo = {
  work_day: {
    icon: Sun,
    label: 'Day Shift',
    description: 'Working during daytime hours',
    color: 'text-amber-400',
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
    gradient: 'from-amber-500/20 to-transparent',
  },
  work_night: {
    icon: Moon,
    label: 'Night Shift',
    description: 'Working during nighttime hours',
    color: 'text-indigo-400',
    bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/30',
    gradient: 'from-indigo-500/20 to-transparent',
  },
  off: {
    icon: Coffee,
    label: 'Off Day',
    description: 'Rest and recovery day',
    color: 'text-emerald-400',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/30',
    gradient: 'from-emerald-500/20 to-transparent',
  },
};

export function DayInspector({ 
  date, 
  dayData, 
  onClose,
  onAddCommitment,
  onAddLeave,
  onEditDay 
}: DayInspectorProps) {
  const workInfo = dayData?.work_type ? workTypeInfo[dayData.work_type] : null;
  const hasData = dayData !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden"
    >
      {/* Header with Gradient */}
      <div className={cn(
        'relative px-6 py-5 border-b border-white/5',
        workInfo && `bg-gradient-to-r ${workInfo.gradient}`
      )}>
        <div className="flex items-start justify-between">
          <div>
            <motion.h3 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold tracking-tight"
            >
              {format(date, 'EEEE')}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-watchman-muted mt-0.5 flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              {format(date, 'MMMM d, yyyy')}
            </motion.p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Decorative Element */}
        {workInfo && (
          <div className="absolute top-4 right-16 w-20 h-20 rounded-full opacity-10 blur-xl" 
            style={{ background: workInfo.bg.includes('amber') ? '#F59E0B' : workInfo.bg.includes('indigo') ? '#6366F1' : '#10B981' }} 
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Cycle Day */}
        <AnimatePresence>
          {dayData?.cycle_day && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 glass rounded-2xl"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gradient">
                    {dayData.cycle_day}
                  </span>
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-watchman-accent flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </motion.div>
              </div>
              <div>
                <p className="text-xs font-medium text-watchman-muted uppercase tracking-wider">Cycle Day</p>
                <p className="font-semibold mt-0.5">Day {dayData.cycle_day} of rotation</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Work Type */}
        {workInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <h4 className="text-xs font-medium text-watchman-muted uppercase tracking-wider px-1">
              Work Status
            </h4>
            <div className={cn(
              'flex items-center gap-4 p-4 rounded-2xl',
              'bg-gradient-to-r',
              workInfo.gradient
            )}>
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
                  workInfo.bg,
                  workInfo.glow
                )}
              >
                <workInfo.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className="font-semibold text-lg">{workInfo.label}</p>
                <p className="text-sm text-watchman-muted">{workInfo.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leave Status */}
        {dayData?.is_leave && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h4 className="text-xs font-medium text-watchman-muted uppercase tracking-wider px-1">
              Leave
            </h4>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-500/20 to-transparent border border-teal-500/20">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
              >
                <Plane className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <p className="font-semibold text-teal-400">On Leave</p>
                <p className="text-sm text-watchman-muted">Scheduled leave day</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Commitments */}
        {hasData && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-medium text-watchman-muted uppercase tracking-wider">
                Commitments
              </h4>
              {onAddCommitment && (
                <motion.button
                  onClick={onAddCommitment}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 text-xs text-watchman-accent hover:text-watchman-accent/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              )}
            </div>

            {dayData?.commitments && dayData.commitments.length > 0 ? (
              <div className="space-y-2">
                {dayData.commitments.map((commitment, i) => (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center gap-3 p-3 glass rounded-xl group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-watchman-accent/20 transition-shadow">
                      <GraduationCap className="w-5 h-5 text-watchman-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-watchman-accent transition-colors">
                        {commitment.name}
                      </p>
                      <p className="text-xs text-watchman-muted capitalize">
                        {commitment.type}
                        {commitment.hours && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {commitment.hours}h
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 glass rounded-2xl text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-watchman-muted/50" />
                </div>
                <p className="text-sm text-watchman-muted">No commitments scheduled</p>
                {onAddCommitment && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onAddCommitment}
                    className="mt-3 gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Commitment
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* No Data State */}
        {!hasData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 glass rounded-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-watchman-muted/50" />
            </div>
            <p className="text-watchman-muted mb-2">
              No schedule data for this day
            </p>
            <p className="text-sm text-watchman-muted/60">
              Generate your calendar first to see details
            </p>
          </motion.div>
        )}

        {/* Preview Indicator */}
        {dayData?.is_preview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-watchman-accent/10 border border-watchman-accent/20"
          >
            <div className="w-8 h-8 rounded-lg bg-watchman-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-watchman-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-watchman-accent">Preview Mode</p>
              <p className="text-xs text-watchman-muted">Changes are not yet applied</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      {hasData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-6 py-4 border-t border-white/5 flex gap-3 bg-white/[0.02]"
        >
          {onAddLeave && !dayData?.is_leave && (
            <Button
              variant="glass"
              size="sm"
              className="flex-1 gap-2"
              onClick={onAddLeave}
            >
              <Plane className="w-4 h-4" />
              Add Leave
            </Button>
          )}
          {onEditDay && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2"
              onClick={onEditDay}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Quick Stats Component for Day
interface DayStatsProps {
  cycleDay: number;
  totalCycleDays: number;
  workType: 'day' | 'night' | 'off' | null;
  commitmentCount: number;
  totalHours: number;
}

export function DayQuickStats({ 
  cycleDay, 
  totalCycleDays, 
  workType, 
  commitmentCount,
  totalHours 
}: DayStatsProps) {
  const stats = [
    { label: 'Cycle Progress', value: `${cycleDay} / ${totalCycleDays}`, icon: Sparkles },
    { label: 'Work Type', value: workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : 'None', icon: Sun },
    { label: 'Commitments', value: commitmentCount.toString(), icon: BookOpen },
    { label: 'Study Hours', value: `${totalHours}h`, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="p-4 glass rounded-2xl border border-white/5 group cursor-default"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="w-3.5 h-3.5 text-watchman-muted group-hover:text-watchman-accent transition-colors" />
            <p className="text-xs text-watchman-muted">{stat.label}</p>
          </div>
          <p className="text-xl font-bold group-hover:text-watchman-accent transition-colors">
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
