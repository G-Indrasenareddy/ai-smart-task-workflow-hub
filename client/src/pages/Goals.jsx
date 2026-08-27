import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import GoalStatsCard from '../components/GoalStatsCard';
import GoalProgressCard from '../components/GoalProgressCard';
import CreateGoalModal from '../components/CreateGoalModal';
import EditGoalModal from '../components/EditGoalModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import SuccessToast from '../components/SuccessToast';

import { useGoals } from '../context/GoalContext';

export default function Goals() {
  // Get shared goals state and actions from GoalContext
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();

  // Local UI state only
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('progress');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Compute Goal Summaries
  const summaries = useMemo(() => {
    const total = goals.length;
    const active = goals.filter((g) => g.status === 'Active').length;
    const completed = goals.filter((g) => g.status === 'Completed').length;
    const atRisk = goals.filter((g) => g.status === 'At Risk').length;

    return {
      total,
      active,
      completed,
      atRisk,
    };
  }, [goals]);

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    return [...goals]
      .filter((goal) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
          (goal.title || '').toLowerCase().includes(search) ||
          (goal.description || '').toLowerCase().includes(search);

        const matchesStatus =
          statusFilter === 'All' || goal.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }

        if (sortBy === 'targetDate') {
          return (a.targetDate || '').localeCompare(
            b.targetDate || ''
          );
        }

        return (b.progress || 0) - (a.progress || 0);
      });
  }, [goals, searchTerm, statusFilter, sortBy]);

  // Create Goal
  const handleCreateGoal = (newGoalData) => {
    createGoal(newGoalData);

    setToastMessage('Goal created successfully!');
    setIsCreateModalOpen(false);
  };

  // Save Edited Goal
  const handleSaveGoal = (updatedGoal) => {
    updateGoal(updatedGoal);

    setToastMessage('Goal updated successfully!');
    setEditingGoal(null);
  };

  // Confirm Delete Goal
  const handleConfirmDeleteGoal = () => {
    if (!deletingGoal) return;

    deleteGoal(deletingGoal.id);

    setToastMessage('Goal deleted successfully!');
    setDeletingGoal(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <SuccessToast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGoal={handleCreateGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={!!editingGoal}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSaveGoal={handleSaveGoal}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingGoal}
        itemTitle={deletingGoal?.title}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDeleteGoal}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Goals
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Define your objectives and track your progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GoalStatsCard
          label="Total Goals"
          value={summaries.total}
          icon={Target}
          iconBgColor="bg-slate-800"
          iconTextColor="text-slate-300"
        />

        <GoalStatsCard
          label="Active"
          value={summaries.active}
          icon={Clock}
          iconBgColor="bg-indigo-500/10"
          iconTextColor="text-indigo-400"
        />

        <GoalStatsCard
          label="Completed"
          value={summaries.completed}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-400"
        />

        <GoalStatsCard
          label="At Risk"
          value={summaries.atRisk}
          icon={AlertTriangle}
          iconBgColor="bg-rose-500/10"
          iconTextColor="text-rose-400"
        />
      </div>

      {/* Search and Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">
                All Goals
              </option>

              <option value="Active" className="bg-slate-900">
                Active
              </option>

              <option value="Completed" className="bg-slate-900">
                Completed
              </option>

              <option value="At Risk" className="bg-slate-900">
                At Risk
              </option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="progress" className="bg-slate-900">
                Sort by Progress
              </option>

              <option value="targetDate" className="bg-slate-900">
                Sort by Target Date
              </option>

              <option value="title" className="bg-slate-900">
                Sort by Title
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No goals match your search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalProgressCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => setEditingGoal(g)}
              onDelete={(g) => setDeletingGoal(g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}