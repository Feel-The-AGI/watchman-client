'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  Timer,
  Shield,
  Wrench,
  UserX,
  Siren,
  FileWarning,
  MoreHorizontal,
  HeartPulse,
  Ban,
  Weight,
  DollarSign,
  CalendarClock,
  MessageSquareWarning,
  ShieldAlert,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Incident {
  id: string;
  date: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  reported_to?: string;
  witnesses?: string;
  outcome?: string;
  created_at: string;
  updated_at?: string;
}

interface DailyLog {
  id: string;
  date: string;
  note: string;
  actual_hours?: number;
  overtime_hours?: number;
  created_at: string;
  updated_at?: string;
}

const incidentTypes: Record<string, { icon: typeof Timer; label: string; color: string; bg: string }> = {
  overtime: { icon: Timer, label: 'Overtime', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  safety: { icon: Shield, label: 'Safety Issue', color: 'text-red-400', bg: 'bg-red-500/20' },
  equipment: { icon: Wrench, label: 'Equipment Failure', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  harassment: { icon: UserX, label: 'Harassment', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  injury: { icon: Siren, label: 'Injury', color: 'text-red-500', bg: 'bg-red-600/20' },
  policy_violation: { icon: FileWarning, label: 'Policy Violation', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  health: { icon: HeartPulse, label: 'Health / Sick', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  discrimination: { icon: Ban, label: 'Discrimination', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
  workload: { icon: Weight, label: 'Excessive Workload', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  compensation: { icon: DollarSign, label: 'Pay / Compensation', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  scheduling: { icon: CalendarClock, label: 'Scheduling Issue', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  communication: { icon: MessageSquareWarning, label: 'Communication Issue', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  retaliation: { icon: ShieldAlert, label: 'Retaliation', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  environment: { icon: Building2, label: 'Work Environment', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

const severityColors: Record<string, { text: string; bg: string; border: string; label: string }> = {
  low: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'Low' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Medium' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'High' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Critical' },
};

interface IncidentModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentModal({ incident, isOpen, onClose }: IncidentModalProps) {
  if (!incident) return null;

  const typeInfo = incidentTypes[incident.type] || incidentTypes.other;
  const sevInfo = severityColors[incident.severity] || severityColors.medium;
  const TypeIcon = typeInfo.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className={cn('p-6 border-b border-white/5', sevInfo.bg)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', typeInfo.bg)}>
                      <TypeIcon className={cn('w-7 h-7', typeInfo.color)} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{incident.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', typeInfo.bg, typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', sevInfo.bg, sevInfo.text, sevInfo.border)}>
                          {sevInfo.label} Severity
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Date */}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-watchman-muted" />
                  <span className="text-watchman-muted">Date:</span>
                  <span className="font-medium">{format(new Date(incident.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-watchman-muted">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-sm leading-relaxed p-4 glass rounded-xl border border-white/5">
                    {incident.description}
                  </p>
                </div>

                {/* Reported To */}
                {incident.reported_to && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-watchman-muted mt-0.5" />
                    <div>
                      <p className="text-sm text-watchman-muted">Reported To</p>
                      <p className="text-sm font-medium">{incident.reported_to}</p>
                    </div>
                  </div>
                )}

                {/* Witnesses */}
                {incident.witnesses && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-watchman-muted mt-0.5" />
                    <div>
                      <p className="text-sm text-watchman-muted">Witnesses</p>
                      <p className="text-sm font-medium">{incident.witnesses}</p>
                    </div>
                  </div>
                )}

                {/* Outcome */}
                {incident.outcome && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-watchman-muted mt-0.5" />
                    <div>
                      <p className="text-sm text-watchman-muted">Outcome</p>
                      <p className="text-sm font-medium">{incident.outcome}</p>
                    </div>
                  </div>
                )}

                {/* Logged Time */}
                <div className="flex items-center gap-3 text-xs text-watchman-muted pt-2 border-t border-white/5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Logged {format(new Date(incident.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface LogModalProps {
  log: DailyLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogModal({ log, isOpen, onClose }: LogModalProps) {
  if (!log) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Daily Note</h2>
                      <p className="text-sm text-watchman-muted mt-1">
                        {format(new Date(log.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Hours */}
                {(log.actual_hours || log.overtime_hours) && (
                  <div className="flex gap-4">
                    {log.actual_hours && (
                      <div className="flex-1 p-4 glass rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-400">{log.actual_hours}h</p>
                        <p className="text-xs text-watchman-muted">Hours Worked</p>
                      </div>
                    )}
                    {log.overtime_hours && log.overtime_hours > 0 && (
                      <div className="flex-1 p-4 glass rounded-xl text-center">
                        <p className="text-2xl font-bold text-amber-400">{log.overtime_hours}h</p>
                        <p className="text-xs text-watchman-muted">Overtime</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Note */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-watchman-muted">
                    <FileText className="w-4 h-4" />
                    <span>Note</span>
                  </div>
                  <p className="text-sm leading-relaxed p-4 glass rounded-xl border border-white/5 whitespace-pre-wrap">
                    {log.note}
                  </p>
                </div>

                {/* Logged Time */}
                <div className="flex items-center gap-3 text-xs text-watchman-muted pt-2 border-t border-white/5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Logged {format(new Date(log.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
