import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { taskService } from './taskService.js';
import { goalService } from './goalService.js';

function buildMinimalUserContext(tasks, goals) {
  // Extract minimal non-sensitive data ONLY
  const taskItems = tasks.map((t) => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate || 'Today',
  }));

  const goalItems = goals.map((g) => ({
    title: g.title,
    progress: g.progress,
    status: g.status,
  }));

  const totalTasks = taskItems.length;
  const completedCount = taskItems.filter((t) => t.status === 'Completed').length;
  const inProgressCount = taskItems.filter((t) => t.status === 'In Progress').length;
  const toDoCount = taskItems.filter((t) => t.status === 'To Do').length;

  const taskSummary = totalTasks === 0
    ? 'User has no tasks currently.'
    : `Tasks Overview (${totalTasks} total: ${completedCount} Completed, ${inProgressCount} In Progress, ${toDoCount} To Do). Tasks List: ${taskItems.map((t) => `"${t.title}" [Status: ${t.status}, Priority: ${t.priority}]`).join('; ')}.`;

  const goalSummary = goalItems.length === 0
    ? 'User has no goals currently.'
    : `Goals Overview (${goalItems.length} total). Goals List: ${goalItems.map((g) => `"${g.title}" [Progress: ${g.progress}%, Status: ${g.status}]`).join('; ')}.`;

  return `
PRODUCTIVITY CONTEXT:
${taskSummary}
${goalSummary}
`;
}

function generateLocalFallbackResponse(userMessage, tasks, goals) {
  const lower = userMessage.toLowerCase();
  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const toDo = tasks.filter((t) => t.status === 'To Do').length;
  const highPriority = tasks.filter((t) => t.priority === 'High');

  if (lower.includes('priority') || lower.includes('prioritize') || lower.includes('first')) {
    if (highPriority.length > 0) {
      return `Based on your live workspace, your top priority item is "${highPriority[0].title}" (Priority: High, Status: ${highPriority[0].status}). Focus on this item to maintain productivity momentum.`;
    }
    if (toDo.length > 0) {
      const nextTask = tasks.find((t) => t.status === 'To Do');
      return `Your top recommended next action is "${nextTask.title}" (Status: To Do). Completing pending items will build momentum.`;
    }
    return 'You have completed all pending tasks! Consider setting a new goal or adding action items to stay on track.';
  }

  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('progress')) {
    const rate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    return `Productivity Summary: You have ${totalTasks} total task(s) (${completed} Completed, ${inProgress} In Progress, ${toDo} To Do) across ${goals.length} goal(s). Overall task completion rate is ${rate}%.`;
  }

  if (lower.includes('goal') || lower.includes('risk')) {
    const atRisk = goals.filter((g) => g.status === 'At Risk');
    if (atRisk.length > 0) {
      return `Goal Alert: Goal "${atRisk[0].title}" is marked 'At Risk' with ${atRisk[0].progress}% progress. Schedule a focus block to clear blockers.`;
    }
    return `Goal Tracking: You have ${goals.length} active goal(s) with no critical risks reported. Continue tracking milestones on your Goals dashboard.`;
  }

  return `I reviewed your workspace context (${totalTasks} task(s), ${goals.length} goal(s)). Ask me to prioritize your day, summarize your progress, or review goal status!`;
}

export const aiService = {
  async generateChatResponse(userId, userMessage, history = []) {
    // ALWAYS query by req.user.id
    const tasks = await taskService.getAllTasks(userId);
    const goals = await goalService.getAllGoals(userId);

    const isApiKeyConfigured =
      config.geminiApiKey &&
      config.geminiApiKey.trim() !== '' &&
      config.geminiApiKey !== 'your_gemini_api_key_here';

    if (!isApiKeyConfigured) {
      return {
        text: generateLocalFallbackResponse(userMessage, tasks, goals),
        isFallback: true,
        provider: 'local-context-engine',
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const contextPrompt = buildMinimalUserContext(tasks, goals);
      const fullPrompt = `${contextPrompt}\nUser Question: "${userMessage}"\nProvide a clear, helpful, action-oriented response. Do not perform or invent database actions.`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        text: text.trim(),
        isFallback: false,
        provider: 'gemini-1.5-flash',
      };
    } catch (error) {
      // Clean fallback response without leaking stack traces or API keys
      return {
        text: generateLocalFallbackResponse(userMessage, tasks, goals),
        isFallback: true,
        provider: 'local-context-fallback',
      };
    }
  },

  async suggestSubtasks(userId, goalTitle, goalDescription = '') {
    const isApiKeyConfigured =
      config.geminiApiKey &&
      config.geminiApiKey.trim() !== '' &&
      config.geminiApiKey !== 'your_gemini_api_key_here';

    if (!isApiKeyConfigured) {
      return [
        { title: `Define requirements for ${goalTitle}`, priority: 'High', dueDate: 'Tomorrow' },
        { title: `Execute core implementation steps`, priority: 'Medium', dueDate: 'In 3 Days' },
        { title: `Review and test final deliverables`, priority: 'Medium', dueDate: 'In 1 Week' },
      ];
    }

    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Goal Title: "${goalTitle}"\nGoal Description: "${goalDescription}"\nGenerate 3 key sub-tasks to complete this goal. Output JSON array of objects with keys: title, priority ("High", "Medium", or "Low"), dueDate ("Today", "Tomorrow", "In 3 Days").`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
      return JSON.parse(cleanJson);
    } catch (error) {
      return [
        { title: `Define requirements for ${goalTitle}`, priority: 'High', dueDate: 'Tomorrow' },
        { title: `Execute core implementation steps`, priority: 'Medium', dueDate: 'In 3 Days' },
        { title: `Review and test final deliverables`, priority: 'Medium', dueDate: 'In 1 Week' },
      ];
    }
  },

  async getAIInsights(userId) {
    const tasks = await taskService.getAllTasks(userId);
    const goals = await goalService.getAllGoals(userId);

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completionRate: `${completionRate}%`,
      activeTasksCount: tasks.filter((t) => t.status !== 'Completed').length,
      activeGoalsCount: goals.filter((g) => g.status === 'Active').length,
      recommendation: completionRate > 50
        ? 'Great pace! You are consistently completing high-priority items.'
        : 'Focus on completing your top pending "To Do" items before taking on new goals.',
    };
  },
};
