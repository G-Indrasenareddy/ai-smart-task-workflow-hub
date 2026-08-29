import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { goalApi } from '../services/goalApi';
import { useAuth } from './AuthContext';

const GoalContext = createContext();

export function GoalProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState(null);

  // Fetch Goals for the currently authenticated user
  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setGoals([]);
      setGoalsLoading(false);
      return;
    }

    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const data = await goalApi.getGoals();
      setGoals(data);
      // Cache user-scoped snapshot
      try {
        localStorage.setItem(`flowmind_goals_${user.id}`, JSON.stringify(data));
      } catch (e) {
        // Ignore quota errors
      }
    } catch (err) {
      console.warn('[GoalContext] API fetch failed, loading user-scoped local snapshot:', err.message);
      setGoalsError('Backend API unreachable. Loaded local snapshot.');
      try {
        const saved = localStorage.getItem(`flowmind_goals_${user.id}`);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGoals(parsed);
          }
        }
      } catch (e) {
        console.error('[GoalContext] Error reading user-scoped local cache:', e);
      }
    } finally {
      setGoalsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Re-fetch or clear goals when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchGoals();
    } else {
      setGoals([]);
      setGoalsLoading(false);
      setGoalsError(null);
    }
  }, [isAuthenticated, user, fetchGoals]);

  const createGoal = async (newGoalData) => {
    try {
      const created = await goalApi.createGoal(newGoalData);
      setGoals((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[GoalContext createGoal Error]:', err.message);
      throw err;
    }
  };

  const updateGoal = async (goalIdOrGoal, goalData) => {
    try {
      let id;
      let payload;
      if (typeof goalIdOrGoal === 'object' && goalIdOrGoal !== null) {
        id = goalIdOrGoal.id || goalIdOrGoal._id;
        payload = goalData || goalIdOrGoal;
      } else {
        id = goalIdOrGoal;
        payload = goalData;
      }
      const updated = await goalApi.updateGoal(id, payload);
      setGoals((prev) => prev.map((g) => ((g.id || g._id) === id ? updated : g)));
      return updated;
    } catch (err) {
      console.error('[GoalContext updateGoal Error]:', err.message);
      throw err;
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await goalApi.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => (g.id || g._id) !== goalId));
    } catch (err) {
      console.error('[GoalContext deleteGoal Error]:', err.message);
      throw err;
    }
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        goalsLoading,
        goalsError,
        fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
