import { createContext, useContext, useState, useEffect } from 'react';

const initialTasksData = [
  {
    id: 1,
    title: 'Finalize Dashboard UI',
    description: 'Refine responsive layouts and card components.',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Aug 28, 2026',
  },
  {
    id: 2,
    title: 'Review React Components',
    description: 'Audit reusable component signatures and props.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: 'Aug 29, 2026',
  },
  {
    id: 3,
    title: 'Design MongoDB Schema',
    description: 'Define Mongoose schemas for tasks and goals.',
    status: 'To Do',
    priority: 'High',
    dueDate: 'Sep 01, 2026',
  },
  {
    id: 4,
    title: 'Implement Authentication',
    description: 'Set up JWT auth middleware and user routes.',
    status: 'To Do',
    priority: 'High',
    dueDate: 'Sep 03, 2026',
  },
  {
    id: 5,
    title: 'Test API Endpoints',
    description: 'Perform integration testing across core REST routes.',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: 'Aug 30, 2026',
  },
  {
    id: 6,
    title: 'Update Project Documentation',
    description: 'Complete sitemap, setup instructions, and architecture docs.',
    status: 'Completed',
    priority: 'Low',
    dueDate: 'Aug 26, 2026',
  },
  {
    id: 7,
    title: 'Prepare Sprint Demo',
    description: 'Build slides and record video walkthrough.',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Aug 27, 2026',
  },
  {
    id: 8,
    title: 'Review AI Integration Plan',
    description: 'Plan prompt templates and API client service.',
    status: 'Completed',
    priority: 'Low',
    dueDate: 'Aug 25, 2026',
  },
];

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('flowmind_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return initialTasksData;
  });

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('flowmind_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  const createTask = (newTaskData) => {
    const newTask = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...newTaskData,
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const toggleTaskStatus = (taskId) => {
    const nextStatus = {
      'To Do': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'To Do',
    };
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedStatus = nextStatus[t.status] || 'To Do';
          return { ...t, status: updatedStatus };
        }
        return t;
      })
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
