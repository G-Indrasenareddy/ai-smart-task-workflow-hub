import { createContext, useContext, useState, useEffect } from 'react';

const initialGoalsData = [
  {
    id: 1,
    title: 'Launch FlowMind AI Beta',
    description: 'Prepare and launch the first beta version of FlowMind AI.',
    progress: 75,
    status: 'Active',
    targetDate: 'September 30, 2026',
    tasksCount: 8,
  },
  {
    id: 2,
    title: 'Complete Frontend Component Library',
    description: 'Build reusable and responsive UI components.',
    progress: 60,
    status: 'Active',
    targetDate: 'September 15, 2026',
    tasksCount: 12,
  },
  {
    id: 3,
    title: 'Q3 User Acquisition Campaign',
    description: 'Improve product awareness and attract early users.',
    progress: 40,
    status: 'At Risk',
    targetDate: 'September 30, 2026',
    tasksCount: 10,
  },
  {
    id: 4,
    title: 'Improve Backend API Architecture',
    description: 'Create a scalable backend architecture for FlowMind AI.',
    progress: 85,
    status: 'Active',
    targetDate: 'October 10, 2026',
    tasksCount: 6,
  },
  {
    id: 5,
    title: 'Set Up Project Documentation',
    description: 'Complete technical and project documentation.',
    progress: 100,
    status: 'Completed',
    targetDate: 'August 20, 2026',
    tasksCount: 5,
  },
  {
    id: 6,
    title: 'Initial UI Design System',
    description: 'Create the initial visual design system for the application.',
    progress: 100,
    status: 'Completed',
    targetDate: 'August 15, 2026',
    tasksCount: 7,
  },
];

const GoalContext = createContext();

export function GoalProvider({ children }) {
  console.log('[GoalProvider] Rendering GoalProvider component');

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('flowmind_goals');
      console.log('[GoalContext init] Checking localStorage key flowmind_goals:', saved);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          console.log('[GoalContext init] Initialized state from localStorage. Total count:', parsed.length);
          return parsed;
        }
      }
    } catch (e) {
      console.error('[GoalContext init] Error reading localStorage:', e);
    }
    console.log('[GoalContext init] Initialized state from fallback initialGoalsData. Total count:', initialGoalsData.length);
    return initialGoalsData;
  });

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      console.log('[GoalContext useEffect] Saving goals to localStorage. Count:', goals.length);
      localStorage.setItem('flowmind_goals', JSON.stringify(goals));
    } catch (e) {
      console.error('[GoalContext useEffect] Failed to save goals to localStorage', e);
    }
  }, [goals]);

  const createGoal = (newGoalData) => {
    const newGoal = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: newGoalData.title || 'New Goal',
      description: newGoalData.description || '',
      progress: Number(newGoalData.progress) || 0,
      status: newGoalData.status || 'Active',
      targetDate: newGoalData.targetDate || 'September 30, 2026',
      tasksCount: Number(newGoalData.tasksCount) || 0,
    };
    console.log('[GoalContext createGoal] Creating new goal object:', newGoal);

    setGoals((prev) => {
      const updated = [newGoal, ...prev];
      console.log('[GoalContext createGoal] Updated goals array count:', updated.length);
      try {
        localStorage.setItem('flowmind_goals', JSON.stringify(updated));
        console.log('[GoalContext createGoal] Synchronous localStorage readback count:', JSON.parse(localStorage.getItem('flowmind_goals')).length);
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    return newGoal;
  };

  const updateGoal = (updatedGoal) => {
    console.log('[GoalContext updateGoal] Updating goal:', updatedGoal.id);
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
      try {
        localStorage.setItem('flowmind_goals', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const deleteGoal = (goalId) => {
    console.log('[GoalContext deleteGoal] Deleting goal ID:', goalId);
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== goalId);
      try {
        localStorage.setItem('flowmind_goals', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
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
