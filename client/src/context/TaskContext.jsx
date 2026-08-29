import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { taskApi } from '../services/taskApi';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);

  // Fetch Tasks for the currently authenticated user
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    setTasksError(null);
    try {
      const data = await taskApi.getTasks();
      setTasks(data);
      // Cache user-scoped snapshot
      try {
        localStorage.setItem(`flowmind_tasks_${user.id}`, JSON.stringify(data));
      } catch (e) {
        // Ignore quota errors
      }
    } catch (err) {
      console.warn('[TaskContext] API fetch failed, loading user-scoped local snapshot:', err.message);
      setTasksError('Backend API unreachable. Loaded local snapshot.');
      try {
        const saved = localStorage.getItem(`flowmind_tasks_${user.id}`);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
          }
        }
      } catch (e) {
        console.error('[TaskContext] Error reading user-scoped local cache:', e);
      }
    } finally {
      setTasksLoading(false);
    }
  }, [isAuthenticated, user]);

  // Re-fetch or clear tasks when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    } else {
      setTasks([]);
      setTasksLoading(false);
      setTasksError(null);
    }
  }, [isAuthenticated, user, fetchTasks]);

  const createTask = async (newTaskData) => {
    try {
      const created = await taskApi.createTask(newTaskData);
      setTasks((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[TaskContext createTask Error]:', err.message);
      throw err;
    }
  };

  const updateTask = async (taskIdOrTask, taskData) => {
    try {
      let id;
      let payload;
      if (typeof taskIdOrTask === 'object' && taskIdOrTask !== null) {
        id = taskIdOrTask.id || taskIdOrTask._id;
        payload = taskData || taskIdOrTask;
      } else {
        id = taskIdOrTask;
        payload = taskData;
      }
      const updated = await taskApi.updateTask(id, payload);
      setTasks((prev) => prev.map((t) => ((t.id || t._id) === id ? updated : t)));
      return updated;
    } catch (err) {
      console.error('[TaskContext updateTask Error]:', err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => (t.id || t._id) !== taskId));
    } catch (err) {
      console.error('[TaskContext deleteTask Error]:', err.message);
      throw err;
    }
  };

  const toggleTaskStatus = async (taskId) => {
    const task = tasks.find((t) => (t.id || t._id) === taskId);
    if (!task) return;

    const nextStatus = {
      'To Do': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'To Do',
    };
    const updatedStatus = nextStatus[task.status] || 'To Do';

    try {
      const updated = await taskApi.updateTask(taskId, { status: updatedStatus });
      setTasks((prev) => prev.map((t) => ((t.id || t._id) === taskId ? updated : t)));
      return updated;
    } catch (err) {
      console.error('[TaskContext toggleTaskStatus Error]:', err.message);
      throw err;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        tasksLoading,
        tasksError,
        fetchTasks,
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
