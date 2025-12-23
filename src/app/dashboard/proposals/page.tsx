'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileCheck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Proposal {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  intent: string;
  proposed_diff: {
    changes: Array<{
      type: string;
      description: string;
      affected_dates?: string[];
    }>;
  };
  explanation: string;
  warnings?: string[];
  alternatives?: Array<{
    id: string;
    description: string;
  }>;
  created_at: string;
  reviewed_at?: string;
}

type TabType = 'pending' | 'history';

export default function ProposalsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New proposal state
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedProposal, setParsedProposal] = useState<Proposal | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Review modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, [activeTab]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = activeTab === 'pending' ? 'proposed' : undefined;
      // Proposals are stored as mutations in the database
      const response = await api.mutations.list(status);
      // Map mutation fields to proposal interface
      const mapped = (response || []).map((m: any) => ({
        id: m.id,
        status: m.status === 'proposed' ? 'pending' : m.status,
        intent: m.intent || 'Calendar Change',
        proposed_diff: m.proposed_diff || { changes: [] },
        explanation: m.explanation || '',
        warnings: m.violations || [],
        alternatives: m.alternatives || [],
        created_at: m.proposed_at || m.created_at,
        reviewed_at: m.reviewed_at,
      }));
      setProposals(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleParseInput = async () => {
    if (!inputText.trim()) return;

    try {
      setParsing(true);
      setParseError(null);
      const response = await api.proposals.parse(inputText);
      setParsedProposal(response);
      setShowNewProposal(false);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse input');
    } finally {
      setParsing(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      setActionLoading(true);
      await api.mutations.approve(proposalId);
      setParsedProposal(null);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err: any) {
      setError(err.message || 'Failed to approve proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      setActionLoading(true);
      await api.mutations.reject(proposalId);
      setParsedProposal(null);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err: any) {
      setError(err.message || 'Failed to reject proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-watchman-muted">
            Review and approve calendar changes
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowNewProposal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Proposal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'pending'
              ? 'bg-watchman-accent text-white'
              : 'text-watchman-muted hover:text-white hover:bg-white/5'
          )}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'history'
              ? 'bg-watchman-accent text-white'
              : 'text-watchman-muted hover:text-white hover:bg-white/5'
          )}
        >
          <FileCheck className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-watchman-error flex-shrink-0" />
          <p className="text-sm text-watchman-error">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Proposals List */}
      {!loading && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <EmptyState tab={activeTab} onNewProposal={() => setShowNewProposal(true)} />
          ) : (
            proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => setSelectedProposal(proposal)}
              />
            ))
          )}
        </div>
      )}

      {/* Parsed Proposal Review */}
      <AnimatePresence>
        {parsedProposal && (
          <Modal
            isOpen={true}
            onClose={() => setParsedProposal(null)}
            title="Review Proposal"
          >
            <ProposalReview
              proposal={parsedProposal}
              onApprove={() => handleApprove(parsedProposal.id)}
              onReject={() => handleReject(parsedProposal.id)}
              loading={actionLoading}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Selected Proposal Review */}
      <AnimatePresence>
        {selectedProposal && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedProposal(null)}
            title="Proposal Details"
          >
            <ProposalReview
              proposal={selectedProposal}
              onApprove={() => handleApprove(selectedProposal.id)}
              onReject={() => handleReject(selectedProposal.id)}
              loading={actionLoading}
              showActions={selectedProposal.status === 'pending'}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* New Proposal Modal */}
      <AnimatePresence>
        {showNewProposal && (
          <Modal
            isOpen={true}
            onClose={() => {
              setShowNewProposal(false);
              setInputText('');
              setParseError(null);
            }}
            title="Propose a Change"
          >
            <div className="space-y-4">
              <p className="text-sm text-watchman-muted">
                Paste any text (email, message, schedule) and we&apos;ll parse it into 
                structured changes. You&apos;ll review before anything applies.
              </p>

              <Textarea
                label="Input Text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., 'Your Certificate in Survey & Mapping classes will start on March 15, every Tuesday and Thursday evening from 6-8pm'"
                rows={6}
              />

              {parseError && (
                <div className="p-3 rounded-lg bg-watchman-error/10 border border-watchman-error/20">
                  <p className="text-sm text-watchman-error">{parseError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewProposal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleParseInput}
                  disabled={!inputText.trim() || parsing}
                  className="gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Parse & Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Proposal Card Component
interface ProposalCardProps {
  proposal: Proposal;
  onClick: () => void;
}

function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      label: 'Pending Review',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-watchman-mint',
      bg: 'bg-watchman-mint/10',
      label: 'Approved',
    },
    rejected: {
      icon: XCircle,
      color: 'text-watchman-error',
      bg: 'bg-watchman-error/10',
      label: 'Rejected',
    },
  };

  const status = statusConfig[proposal.status];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-5 bg-watchman-surface rounded-xl border border-white/5 hover:border-watchman-accent/20 transition-colors text-left"
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-2 rounded-lg', status.bg)}>
          <status.icon className={cn('w-5 h-5', status.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{proposal.intent}</h3>
          </div>
          
          <p className="text-sm text-watchman-muted line-clamp-2 mb-3">
            {proposal.explanation}
          </p>

          <div className="flex items-center gap-4 text-xs text-watchman-muted">
            <span className={cn('flex items-center gap-1', status.color)}>
              <status.icon className="w-3 h-3" />
              {status.label}
            </span>
            <span>
              {format(new Date(proposal.created_at), 'MMM d, yyyy')}
            </span>
            {proposal.proposed_diff.changes.length > 0 && (
              <span>
                {proposal.proposed_diff.changes.length} changes
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-watchman-muted flex-shrink-0" />
      </div>
    </motion.button>
  );
}

// Proposal Review Component
interface ProposalReviewProps {
  proposal: Proposal;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
  showActions?: boolean;
}

function ProposalReview({ 
  proposal, 
  onApprove, 
  onReject, 
  loading,
  showActions = true 
}: ProposalReviewProps) {
  return (
    <div className="space-y-6">
      {/* Intent */}
      <div>
        <h3 className="text-sm font-medium text-watchman-muted mb-2">Intent</h3>
        <p className="font-semibold text-lg">{proposal.intent}</p>
      </div>

      {/* Explanation */}
      <div>
        <h3 className="text-sm font-medium text-watchman-muted mb-2">Explanation</h3>
        <p className="text-watchman-muted">{proposal.explanation}</p>
      </div>

      {/* Changes */}
      {proposal.proposed_diff.changes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-watchman-muted mb-3">Proposed Changes</h3>
          <div className="space-y-2">
            {proposal.proposed_diff.changes.map((change, index) => (
              <div
                key={index}
                className="p-3 bg-watchman-bg rounded-lg flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-watchman-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-watchman-accent">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium capitalize">{change.type.replace('_', ' ')}</p>
                  <p className="text-sm text-watchman-muted">{change.description}</p>
                  {change.affected_dates && change.affected_dates.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-watchman-muted">
                      <Calendar className="w-3 h-3" />
                      {change.affected_dates.length} days affected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {proposal.warnings && proposal.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-yellow-400">Warnings</h3>
          </div>
          <ul className="space-y-1">
            {proposal.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-watchman-muted">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {proposal.alternatives && proposal.alternatives.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-watchman-muted mb-3">Alternatives</h3>
          <div className="space-y-2">
            {proposal.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-3 bg-watchman-bg rounded-lg text-sm text-watchman-muted hover:text-white cursor-pointer transition-colors"
              >
                {alt.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && proposal.status === 'pending' && (
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={onReject}
            disabled={loading}
            className="flex-1 gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="primary"
            onClick={onApprove}
            disabled={loading}
            className="flex-1 gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Approve
              </>
            )}
          </Button>
        </div>
      )}

      {/* Status Badge for History */}
      {proposal.status !== 'pending' && (
        <div className={cn(
          'p-4 rounded-xl flex items-center gap-3',
          proposal.status === 'approved' 
            ? 'bg-watchman-mint/10 border border-watchman-mint/20'
            : 'bg-watchman-error/10 border border-watchman-error/20'
        )}>
          {proposal.status === 'approved' ? (
            <CheckCircle className="w-5 h-5 text-watchman-mint" />
          ) : (
            <XCircle className="w-5 h-5 text-watchman-error" />
          )}
          <div>
            <p className="font-medium capitalize">{proposal.status}</p>
            {proposal.reviewed_at && (
              <p className="text-sm text-watchman-muted">
                {format(new Date(proposal.reviewed_at), 'MMM d, yyyy at h:mm a')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  tab: TabType;
  onNewProposal: () => void;
}

function EmptyState({ tab, onNewProposal }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-watchman-surface border border-white/5 flex items-center justify-center mx-auto mb-6">
        {tab === 'pending' ? (
          <CheckCircle className="w-8 h-8 text-watchman-mint" />
        ) : (
          <FileCheck className="w-8 h-8 text-watchman-muted" />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {tab === 'pending' ? 'All caught up!' : 'No history yet'}
      </h3>
      <p className="text-watchman-muted mb-6 max-w-sm mx-auto">
        {tab === 'pending'
          ? 'You have no pending proposals to review. Create one to make changes to your calendar.'
          : 'Approved and rejected proposals will appear here.'}
      </p>
      {tab === 'pending' && (
        <Button variant="primary" onClick={onNewProposal} className="gap-2">
          <Plus className="w-4 h-4" />
          New Proposal
        </Button>
      )}
    </div>
  );
}
