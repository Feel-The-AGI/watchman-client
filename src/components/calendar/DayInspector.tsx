'use client';

import { motion } from 'framer-motion';
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
  Edit2
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
    bg: 'bg-amber-500',
  },
  work_night: {
    icon: Moon,
    label: 'Night Shift',
    description: 'Working during nighttime hours',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500',
  },
  off: {
    icon: Coffee,
    label: 'Off Day',
    description: 'Rest and recovery day',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500',
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-watchman-surface rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h3 className="text-lg font-semibold">
            {format(date, 'EEEE')}
          </h3>
          <p className="text-sm text-watchman-muted">
            {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Cycle Day */}
        {dayData?.cycle_day && (
          <div className="flex items-center gap-4 p-4 bg-watchman-bg rounded-xl">
            <div className="w-12 h-12 rounded-full bg-watchman-accent/10 flex items-center justify-center">
              <span className="text-lg font-bold text-watchman-accent">
                {dayData.cycle_day}
              </span>
            </div>
            <div>
              <p className="text-sm text-watchman-muted">Cycle Day</p>
              <p className="font-medium">Day {dayData.cycle_day} of rotation</p>
            </div>
          </div>
        )}

        {/* Work Type */}
        {workInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-watchman-muted uppercase tracking-wide">
              Work Status
            </h4>
            <div className={cn(
              'flex items-center gap-4 p-4 rounded-xl',
              'bg-gradient-to-r from-white/5 to-transparent'
            )}>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', workInfo.bg)}>
                <workInfo.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{workInfo.label}</p>
                <p className="text-sm text-watchman-muted">{workInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leave Status */}
        {dayData?.is_leave && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-watchman-muted uppercase tracking-wide">
              Leave
            </h4>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-watchman-mint/10 border border-watchman-mint/20">
              <div className="w-10 h-10 rounded-full bg-watchman-mint flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-watchman-mint">On Leave</p>
                <p className="text-sm text-watchman-muted">Scheduled leave day</p>
              </div>
            </div>
          </div>
        )}

        {/* Commitments */}
        {hasData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-watchman-muted uppercase tracking-wide">
                Commitments
              </h4>
              {onAddCommitment && (
                <button
                  onClick={onAddCommitment}
                  className="text-xs text-watchman-accent hover:underline"
                >
                  + Add
                </button>
              )}
            </div>

            {dayData?.commitments && dayData.commitments.length > 0 ? (
              <div className="space-y-2">
                {dayData.commitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="flex items-center gap-3 p-3 bg-watchman-bg rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-watchman-accent/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-watchman-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{commitment.name}</p>
                      <p className="text-xs text-watchman-muted capitalize">
                        {commitment.type}
                        {commitment.hours && ` · ${commitment.hours}h`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-watchman-bg rounded-xl text-center text-watchman-muted">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commitments scheduled</p>
              </div>
            )}
          </div>
        )}

        {/* No Data State */}
        {!hasData && (
          <div className="p-6 bg-watchman-bg rounded-xl text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-watchman-muted" />
            <p className="text-watchman-muted mb-4">
              No schedule data for this day.
              <br />
              Generate your calendar first.
            </p>
          </div>
        )}

        {/* Preview Indicator */}
        {dayData?.is_preview && (
          <div className="flex items-center gap-2 p-3 bg-watchman-accent/10 border border-watchman-accent/20 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 text-watchman-accent flex-shrink-0" />
            <span className="text-watchman-accent">
              This is a preview. Changes are not yet applied.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {hasData && (
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          {onAddLeave && !dayData?.is_leave && (
            <Button
              variant="secondary"
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
        </div>
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
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-watchman-surface rounded-xl border border-white/5">
        <p className="text-xs text-watchman-muted mb-1">Cycle Progress</p>
        <p className="text-lg font-semibold">
          {cycleDay} / {totalCycleDays}
        </p>
      </div>
      <div className="p-3 bg-watchman-surface rounded-xl border border-white/5">
        <p className="text-xs text-watchman-muted mb-1">Work Type</p>
        <p className="text-lg font-semibold capitalize">
          {workType || 'None'}
        </p>
      </div>
      <div className="p-3 bg-watchman-surface rounded-xl border border-white/5">
        <p className="text-xs text-watchman-muted mb-1">Commitments</p>
        <p className="text-lg font-semibold">
          {commitmentCount}
        </p>
      </div>
      <div className="p-3 bg-watchman-surface rounded-xl border border-white/5">
        <p className="text-xs text-watchman-muted mb-1">Study Hours</p>
        <p className="text-lg font-semibold">
          {totalHours}h
        </p>
      </div>
    </div>
  );
}
