import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { taskService } from './taskService.js';
import { goalService } from './goalService.js';

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowDateString(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
}

// -------------------------------------------------------------
// GEMINI QUOTA COOLDOWN ENGINE
// -------------------------------------------------------------
let geminiCooldownUntil = 0;

function isGeminiInCooldown() {
  return Date.now() < geminiCooldownUntil;
}

function setGeminiCooldown(durationMs = 60000) {
  geminiCooldownUntil = Date.now() + durationMs;
  const remainingSec = Math.ceil(durationMs / 1000);
  console.warn(`[aiService] Gemini API quota limit hit (429). Active cooldown for ${remainingSec}s until ${new Date(geminiCooldownUntil).toISOString()}`);
}

// -------------------------------------------------------------
// STEP 1: SINGLE AUTHORITATIVE INTENT ROUTER & STATE MACHINE
// -------------------------------------------------------------
function classifyIntent(userMessage, history = []) {
  const cleanInput = userMessage.trim().toLowerCase();

  // 0. CANCEL COMMAND (Reset all operation states to IDLE)
  if (
    cleanInput === 'cancel' ||
    cleanInput === 'cancel it' ||
    cleanInput === 'never mind' ||
    cleanInput === 'forget it' ||
    cleanInput === 'abort' ||
    cleanInput === 'stop'
  ) {
    return { intent: 'CANCEL_OPERATION', confidence: 0.99, requiresAction: false };
  }

  // 1. GENERIC TASK HELP (Single word "task" or "tasks")
  if (cleanInput === 'task' || cleanInput === 'tasks' || cleanInput === 'task help') {
    return { intent: 'GENERIC_TASK_HELP', confidence: 0.99, requiresAction: false };
  }

  // Filter history to inspect active operations
  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  const revHistory = nonWelcomeHistory.slice().reverse();
  const lastAIMessage = revHistory.find((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  // Check active state indicators in last AI message
  const isDeletionActiveInHistory =
    lastAIText.includes('which task would you like to delete') ||
    lastAIText.includes('are you sure you want to delete') ||
    lastAIText.includes('specify the task title to confirm deletion') ||
    (lastAIText.includes('found') && lastAIText.includes('tasks matching') && lastAIText.includes('delete'));

  const isUpdateActiveInHistory =
    lastAIText.includes('which task would you like to update') ||
    lastAIText.includes('what new name would you like') ||
    lastAIText.includes('what new title') ||
    lastAIText.includes('what would you like to change for task') ||
    lastAIText.includes('what priority should i set for task') ||
    lastAIText.includes('when should task') ||
    lastAIText.includes('what status should i set for task') ||
    (lastAIText.includes('found') && lastAIText.includes('tasks matching') && lastAIText.includes('update'));

  const isCreationActiveInHistory =
    !isUpdateActiveInHistory &&
    !isDeletionActiveInHistory &&
    (lastAIText.includes('task to be called') ||
      lastAIText.includes('task be called') ||
      lastAIText.includes('what priority should i set for this task') ||
      (lastAIText.includes('when should') && lastAIText.includes('be due')));

  // Check Goal Active State Indicators in last AI message
  const isGoalDeletionActiveInHistory =
    lastAIText.includes('which goal would you like to delete') ||
    lastAIText.includes('are you sure you want to delete the goal') ||
    (lastAIText.includes('found') && lastAIText.includes('goals matching') && lastAIText.includes('delete'));

  const isGoalUpdateActiveInHistory =
    lastAIText.includes('which goal would you like to update') ||
    lastAIText.includes('what new name would you like to give to goal') ||
    lastAIText.includes('what would you like to change for goal') ||
    lastAIText.includes('what progress percentage') ||
    lastAIText.includes('target date should i set for goal') ||
    lastAIText.includes('what status should i set for goal') ||
    (lastAIText.includes('found') && lastAIText.includes('goals matching') && lastAIText.includes('update'));

  const isGoalCreationActiveInHistory =
    !isGoalUpdateActiveInHistory &&
    !isGoalDeletionActiveInHistory &&
    !isUpdateActiveInHistory &&
    !isDeletionActiveInHistory &&
    !isCreationActiveInHistory &&
    (lastAIText.includes('goal to be called') ||
      lastAIText.includes('goal be called') ||
      lastAIText.includes('what target date') ||
      lastAIText.includes('target date should i set'));

  // Explicit Task Trigger Verbs
  const isExplicitDeleteTrigger =
    cleanInput === 'delete' ||
    cleanInput === 'remove' ||
    /^(delete|remove|destroy)\b/i.test(cleanInput) ||
    /delete.*task/i.test(cleanInput) ||
    /remove.*task/i.test(cleanInput) ||
    cleanInput === 'delete my task' ||
    cleanInput === 'delete the task';

  const isExplicitUpdateTrigger =
    cleanInput === 'update' ||
    cleanInput === 'edit' ||
    cleanInput === 'change' ||
    cleanInput === 'modify' ||
    /^(update|edit|change|modify|rename)\b/i.test(cleanInput) ||
    /update.*task/i.test(cleanInput) ||
    /edit.*task/i.test(cleanInput) ||
    /change.*task/i.test(cleanInput) ||
    /rename.*to/i.test(cleanInput) ||
    cleanInput === 'update the task' ||
    cleanInput === 'update my task' ||
    cleanInput === 'update the task name';

  const isExplicitCreateTrigger =
    cleanInput === 'create' ||
    cleanInput === 'add' ||
    cleanInput === 'create a task' ||
    cleanInput === 'create task' ||
    cleanInput === 'create the task' ||
    cleanInput === 'add a task' ||
    cleanInput === 'new task' ||
    cleanInput === 'make a task' ||
    cleanInput === 'help me create a task' ||
    /^(can you\s+)?(help me\s+)?(to\s+)?(create|add|make|schedule)\s+(a|the|my|new|some)?\s*task/i.test(cleanInput);

  // Explicit Goal Trigger Verbs
  const isExplicitGoalDeleteTrigger =
    cleanInput === 'delete goal' ||
    cleanInput === 'delete the goal' ||
    cleanInput === 'delete my goal' ||
    cleanInput === 'remove goal' ||
    cleanInput === 'remove my goal' ||
    /^(delete|remove|destroy)\s+(a|the|my)?\s*goal/i.test(cleanInput) ||
    /delete.*goal/i.test(cleanInput) ||
    /remove.*goal/i.test(cleanInput);

  const isExplicitGoalUpdateTrigger =
    cleanInput === 'update goal' ||
    cleanInput === 'update the goal' ||
    cleanInput === 'update my goal' ||
    cleanInput === 'edit goal' ||
    cleanInput === 'edit my goal' ||
    cleanInput === 'change goal' ||
    cleanInput === 'modify goal' ||
    /^(update|edit|change|modify|rename)\s+(a|the|my)?\s*goal/i.test(cleanInput) ||
    /update.*goal/i.test(cleanInput) ||
    /edit.*goal/i.test(cleanInput);

  const isExplicitGoalCreateTrigger =
    cleanInput === 'create goal' ||
    cleanInput === 'create a goal' ||
    cleanInput === 'create the goal' ||
    cleanInput === 'add goal' ||
    cleanInput === 'add a goal' ||
    cleanInput === 'new goal' ||
    cleanInput === 'make a goal' ||
    /^(can you\s+)?(help me\s+)?(to\s+)?(create|add|make|set)\s+(a|the|my|new|some)?\s*goal/i.test(cleanInput);

  // PRECEDENCE RULE A: EXPLICIT TRIGGERS OVERRIDE ALL PREVIOUS ACTIVE STATES
  if (isExplicitGoalDeleteTrigger) {
    return { intent: 'GOAL_DELETION', confidence: 0.98, requiresAction: true };
  }

  if (isExplicitGoalUpdateTrigger) {
    return { intent: 'GOAL_UPDATE', confidence: 0.98, requiresAction: true };
  }

  if (isExplicitGoalCreateTrigger) {
    return { intent: 'GOAL_CREATION', confidence: 0.98, requiresAction: true };
  }

  if (isExplicitDeleteTrigger) {
    return { intent: 'TASK_DELETION', confidence: 0.98, requiresAction: true };
  }

  if (isExplicitUpdateTrigger) {
    return { intent: 'TASK_UPDATE', confidence: 0.98, requiresAction: true };
  }

  if (isExplicitCreateTrigger) {
    return { intent: 'TASK_CREATION', confidence: 0.98, requiresAction: true };
  }

  // PRECEDENCE RULE B: ACTIVE STATE MACHINE CONTINUATION
  if (isGoalDeletionActiveInHistory) {
    return { intent: 'GOAL_DELETION', confidence: 0.98, requiresAction: true };
  }

  if (isGoalUpdateActiveInHistory) {
    return { intent: 'GOAL_UPDATE', confidence: 0.98, requiresAction: true };
  }

  if (isGoalCreationActiveInHistory) {
    return { intent: 'GOAL_CREATION', confidence: 0.98, requiresAction: true };
  }

  if (isDeletionActiveInHistory) {
    return { intent: 'TASK_DELETION', confidence: 0.98, requiresAction: true };
  }

  if (isUpdateActiveInHistory) {
    return { intent: 'TASK_UPDATE', confidence: 0.98, requiresAction: true };
  }

  if (isCreationActiveInHistory) {
    return { intent: 'TASK_CREATION', confidence: 0.98, requiresAction: true };
  }

  // 2. PRODUCTIVITY ANALYTICS & SUMMARIES
  const isProductivityAnalysis =
    cleanInput.includes('summarize my tasks') ||
    cleanInput.includes('task summary') ||
    cleanInput.includes('summarize') ||
    /how am i doing/i.test(cleanInput) ||
    /completion rate/i.test(cleanInput) ||
    /how many tasks/i.test(cleanInput) ||
    /how many goals/i.test(cleanInput) ||
    /tasks are overdue/i.test(cleanInput) ||
    /workspace summary/i.test(cleanInput);

  if (isProductivityAnalysis) {
    return { intent: 'PRODUCTIVITY_ANALYSIS', confidence: 0.95, requiresAction: false };
  }

  // 3. GOAL QUERIES
  const isGoalQuery =
    /what goals/i.test(cleanInput) ||
    /show my goals/i.test(cleanInput) ||
    /list my goals/i.test(cleanInput) ||
    /my goals/i.test(cleanInput) ||
    /goals do i have/i.test(cleanInput) ||
    /goals are active/i.test(cleanInput) ||
    /goals are completed/i.test(cleanInput) ||
    /goal progress/i.test(cleanInput);

  if (isGoalQuery) {
    return { intent: 'GOAL_QUERY', confidence: 0.95, requiresAction: false };
  }

  // 4. TASK QUERY & WORKSPACE DATA QUESTIONS
  const isTaskQuery =
    /what tasks/i.test(cleanInput) ||
    /show my tasks/i.test(cleanInput) ||
    /list my tasks/i.test(cleanInput) ||
    /my tasks/i.test(cleanInput) ||
    /tasks do i have/i.test(cleanInput) ||
    /tasks are due/i.test(cleanInput) ||
    /tasks have i created/i.test(cleanInput) ||
    /tasks are completed/i.test(cleanInput) ||
    /most urgent task/i.test(cleanInput) ||
    cleanInput.includes('work on first') ||
    cleanInput.includes('work on now') ||
    cleanInput.includes('work on today') ||
    cleanInput.includes('work on') ||
    cleanInput.includes('prioritize');

  if (isTaskQuery) {
    return { intent: 'TASK_QUERY', confidence: 0.95, requiresAction: false };
  }

  // 5. GRANULAR TECHNICAL INTENTS (PHASE 22 REFINEMENT)
  const isQuizActiveInHistory =
    lastAIText.includes("let's test your") ||
    lastAIText.includes('reply with a, b, c, or d') ||
    lastAIText.includes('question 1') ||
    lastAIText.includes('question 2') ||
    lastAIText.includes('question 3') ||
    lastAIText.includes('question 4') ||
    lastAIText.includes('question 5');

  const isQuizOptionAnswer =
    isQuizActiveInHistory &&
    (cleanInput === 'a' ||
      cleanInput === 'b' ||
      cleanInput === 'c' ||
      cleanInput === 'd' ||
      cleanInput === '1' ||
      cleanInput === '2' ||
      cleanInput === '3' ||
      cleanInput === '4' ||
      cleanInput.startsWith('option') ||
      /^[a-d][.)]?$/i.test(cleanInput) ||
      cleanInput.length <= 15);

  const isQuizRequest =
    /quiz/i.test(cleanInput) ||
    /test me/i.test(cleanInput) ||
    /ask me.*question/i.test(cleanInput) ||
    /test my.*knowledge/i.test(cleanInput) ||
    cleanInput === 'quiz' ||
    cleanInput === 'start quiz';

  if (isQuizRequest || isQuizOptionAnswer) {
    return { intent: 'TECHNICAL_QUIZ', confidence: 0.98, requiresAction: false };
  }

  const isRoadmapRequest =
    cleanInput.includes('roadmap') ||
    cleanInput.includes('learning path') ||
    cleanInput.includes('study plan') ||
    cleanInput.includes('how to learn') ||
    cleanInput.includes('how should i learn');

  if (isRoadmapRequest) {
    return { intent: 'TECHNICAL_ROADMAP', confidence: 0.98, requiresAction: false };
  }

  const isInterviewRequest =
    cleanInput.includes('interview') ||
    cleanInput.includes('interview questions') ||
    cleanInput.includes('prepare for interview') ||
    cleanInput.includes('prepare mysql interview') ||
    cleanInput.includes('prepare java interview') ||
    cleanInput.includes('prepare python interview');

  if (isInterviewRequest) {
    return { intent: 'TECHNICAL_INTERVIEW', confidence: 0.98, requiresAction: false };
  }

  const isExampleRequest =
    cleanInput === 'give me an example' ||
    cleanInput === 'example' ||
    cleanInput === 'code example' ||
    cleanInput === 'show example' ||
    cleanInput.startsWith('give an example') ||
    cleanInput.startsWith('show an example') ||
    cleanInput.startsWith('give me an example');

  if (isExampleRequest) {
    return { intent: 'TECHNICAL_EXAMPLE', confidence: 0.95, requiresAction: false };
  }

  const isFollowupRequest =
    cleanInput.startsWith('why') ||
    cleanInput === 'why' ||
    cleanInput === 'why?' ||
    cleanInput.includes('tell me more') ||
    cleanInput.includes('explain further') ||
    cleanInput.includes('how does it work');

  if (isFollowupRequest) {
    return { intent: 'TECHNICAL_FOLLOWUP', confidence: 0.95, requiresAction: false };
  }

  const isTechnicalTopic =
    cleanInput.includes('polymorphism') ||
    cleanInput.includes('inner join') ||
    cleanInput.includes('join') ||
    cleanInput.includes('normalization') ||
    cleanInput.includes('indexes') ||
    cleanInput.includes('index') ||
    cleanInput.includes('primary key') ||
    cleanInput.includes('foreign key') ||
    cleanInput.includes('sql') ||
    cleanInput.includes('mysql') ||
    cleanInput.includes('python') ||
    cleanInput.includes('java') ||
    cleanInput.includes('javascript') ||
    cleanInput.includes('react') ||
    cleanInput.includes('decorator') ||
    cleanInput.includes('async') ||
    cleanInput.includes('await') ||
    cleanInput.includes('explain') ||
    cleanInput.includes('teach me') ||
    cleanInput.includes('what is') ||
    cleanInput.includes('dependency injection') ||
    cleanInput.includes('reconciliation');

  if (isTechnicalTopic) {
    return { intent: 'TECHNICAL_EXPLANATION', confidence: 0.95, requiresAction: false };
  }

  // 6. GENERAL CONVERSATION
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|how are you|howdy|sup|thanks|thank you)[\s!.]*$/i.test(cleanInput) ||
    cleanInput.startsWith('how are you')
  ) {
    return { intent: 'GENERAL_CONVERSATION', confidence: 0.95, requiresAction: false };
  }

  return { intent: 'GENERAL_CONVERSATION', confidence: 0.7, requiresAction: false };
}

// -------------------------------------------------------------
// STEP 2: CONTEXT SELECTION LAYER
// -------------------------------------------------------------
function selectContext(intent, userTasks, userGoals) {
  if (intent.startsWith('TECHNICAL_') || intent === 'GENERAL_CONVERSATION') {
    return { tasks: [], goals: [] };
  }
  return { tasks: userTasks, goals: userGoals };
}

// -------------------------------------------------------------
// STEP 3: AUTHORITATIVE TASK CREATION STATE MACHINE
// -------------------------------------------------------------
function handleTaskCreationFlow(userMessage, history = []) {
  const todayStr = getLocalDateString();
  const tomorrowStr = getTomorrowDateString();

  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const isCreationTrigger = (text) => {
    const l = text.toLowerCase().trim();
    return (
      l === 'create' ||
      l === 'add' ||
      l === 'create a task' ||
      l === 'create task' ||
      l === 'create the task' ||
      l === 'add a task' ||
      l === 'new task' ||
      l === 'make a task' ||
      l === 'help me create a task' ||
      /^(can you\s+)?(help me\s+)?(to\s+)?(create|add|make|schedule)\s+(a|the|my|new|some)?\s*task/i.test(l)
    );
  };

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');

  let triggerIndex = -1;
  for (let i = nonWelcomeHistory.length - 1; i >= 0; i--) {
    const msg = nonWelcomeHistory[i];
    if ((msg.role === 'user' || msg.sender === 'user') && isCreationTrigger(msg.content || msg.text || '')) {
      triggerIndex = i;
      break;
    }
  }

  if (isCreationTrigger(cleanInput) || triggerIndex === -1 || triggerIndex === nonWelcomeHistory.length - 1) {
    let directTitle = null;
    let directPriority = null;
    let directDueDate = null;

    if (lowerInput.includes('practice mysql joins')) directTitle = 'Practice MySQL JOINs';
    else if (lowerInput.includes('prepare for mysql interview') || lowerInput.includes('prepare mysql interview')) directTitle = 'Prepare for MySQL interview';
    else if (lowerInput.includes('prepare java interview')) directTitle = 'Prepare Java interview';
    else if (lowerInput.includes('prepare for python interview') || lowerInput.includes('prepare python interview')) directTitle = 'Prepare for Python interview';
    else if (lowerInput.includes('study sql')) directTitle = 'Study SQL Queries';
    else if (
      cleanInput.length > 20 &&
      !lowerInput.startsWith('can you help') &&
      !lowerInput.startsWith('i want to') &&
      !lowerInput.startsWith('help me') &&
      !lowerInput.startsWith('create a task') &&
      !lowerInput.startsWith('create the task') &&
      !lowerInput.startsWith('add a task') &&
      !lowerInput.startsWith('make a task')
    ) {
      directTitle = cleanInput.replace(/^(create|add|make)\s+(a|the|my|new|some)?\s*(high\s+priority\s+)?task\s+(to\s+)?/i, '').trim().replace(/\.+$/, '');
      directTitle = directTitle.charAt(0).toUpperCase() + directTitle.slice(1);
    }

    if (directTitle) {
      if (lowerInput.includes('high priority') || lowerInput.includes('high')) directPriority = 'High';
      else if (lowerInput.includes('low priority') || lowerInput.includes('low')) directPriority = 'Low';
      else directPriority = 'Medium';

      if (lowerInput.includes('tomorrow')) directDueDate = tomorrowStr;
      else directDueDate = todayStr;

      return {
        text: `I have prepared your task proposal. Click **Create Task** below to add it to your workspace:`,
        action: {
          type: 'CREATE_TASK',
          requiresConfirmation: true,
          data: { title: directTitle, priority: directPriority, dueDate: directDueDate, status: 'To Do' },
        },
      };
    }

    return {
      text: `Sure! What would you like the task to be called?`,
      action: null,
    };
  }

  const activeHistory = nonWelcomeHistory.slice(triggerIndex);
  let title = null;
  let priority = null;
  let dueDate = null;

  for (let i = 0; i < activeHistory.length; i++) {
    const msg = activeHistory[i];
    const isAssistant = msg.role === 'assistant' || msg.sender === 'ai';
    const text = (msg.content || msg.text || '').toLowerCase();

    if (isAssistant) {
      const nextUserMsg = activeHistory[i + 1];
      if (nextUserMsg && (nextUserMsg.role === 'user' || nextUserMsg.sender === 'user')) {
        const userReply = nextUserMsg.content || nextUserMsg.text || '';
        const lowerReply = userReply.toLowerCase();

        if (text.includes('task to be called') || text.includes('task be called') || text.includes('task would you like') || text.includes('what would you like the task')) {
          title = userReply.trim().replace(/\.+$/, '');
        } else if (text.includes('what priority') || text.includes('priority should i')) {
          if (lowerReply.includes('high')) priority = 'High';
          else if (lowerReply.includes('low')) priority = 'Low';
          else priority = 'Medium';
        } else if (text.includes('when should') || text.includes('be due')) {
          if (lowerReply.includes('tomorrow')) dueDate = tomorrowStr;
          else if (lowerReply.includes('today')) dueDate = todayStr;
          else if (userReply.match(/\d{4}-\d{2}-\d{2}/)) dueDate = userReply.match(/\d{4}-\d{2}-\d{2}/)[0];
          else dueDate = tomorrowStr;
        }
      }
    }
  }

  const lastAIMessage = activeHistory.slice().reverse().find((m) => m.role === 'assistant' || m.sender === 'ai');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  if (lastAIText.includes('task to be called') || lastAIText.includes('task be called') || lastAIText.includes('task would you like') || lastAIText.includes('what would you like the task')) {
    title = cleanInput.replace(/\.+$/, '');
  } else if (lastAIText.includes('what priority') || lastAIText.includes('priority should i')) {
    if (lowerInput.includes('high')) priority = 'High';
    else if (lowerInput.includes('low')) priority = 'Low';
    else priority = 'Medium';
  } else if (lastAIText.includes('when should') || lastAIText.includes('be due')) {
    if (lowerInput.includes('tomorrow')) dueDate = tomorrowStr;
    else if (lowerInput.includes('today')) dueDate = todayStr;
    else if (cleanInput.match(/\d{4}-\d{2}-\d{2}/)) dueDate = cleanInput.match(/\d{4}-\d{2}-\d{2}/)[0];
    else dueDate = tomorrowStr;
  }

  if (!title) {
    return { text: `Sure! What would you like the task to be called?`, action: null };
  }

  if (!priority) {
    return { text: `Got it: **"${title}"**. What priority should I set for this task? (High, Medium, or Low)`, action: null };
  }

  if (!dueDate) {
    return { text: `Understood (**${priority} priority**). When should **"${title}"** be due? (e.g., Today, Tomorrow, or YYYY-MM-DD)`, action: null };
  }

  return {
    text: `I have prepared your task proposal. Click **Create Task** below to add it to your workspace:`,
    action: {
      type: 'CREATE_TASK',
      requiresConfirmation: true,
      data: { title, priority, dueDate, status: 'To Do' },
    },
  };
}

// -------------------------------------------------------------
// STEP 4: AUTHORITATIVE TASK UPDATE STATE MACHINE
// -------------------------------------------------------------
function handleTaskUpdateFlow(userMessage, history = [], userTasks = []) {
  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  const revHistory = nonWelcomeHistory.slice().reverse();

  const lastAIMessage = revHistory.find((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  let targetTask = null;

  // A) DISAMBIGUATION RESPONSE: USER REPLIED "1" or "2" TO DISAMBIGUATION PROMPT
  if (lastAIText.includes('reply with 1 or 2') || (lastAIText.includes('found') && lastAIText.includes('tasks matching'))) {
    let matchedQuery = '';
    for (const msg of revHistory) {
      const txt = (msg.content || msg.text || '').toLowerCase();
      if ((msg.role === 'user' || msg.sender === 'user') && (txt.includes('update') || txt.includes('delete') || userTasks.some(t => txt.includes(t.title.toLowerCase())))) {
        matchedQuery = txt;
        break;
      }
    }

    const matches = userTasks.filter((t) => matchedQuery.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(matchedQuery));
    if (matches.length > 0) {
      const idx = lowerInput === '2' ? 1 : 0;
      targetTask = matches[idx] || matches[0];
      return {
        text: `What would you like to change for task **"${targetTask.title}"**? — title, priority, status, or due date.`,
        action: null,
      };
    }
  }

  // B) CHECK IF ASSISTANT PREVIOUSLY ASKED "Which task would you like to update?"
  if (lastAIText.includes('which task would you like to update')) {
    const matchingTasks = userTasks.filter(
      (t) => lowerInput.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(lowerInput)
    );

    if (matchingTasks.length === 1) {
      targetTask = matchingTasks[0];
    } else if (matchingTasks.length > 1) {
      if (lowerInput === '1' || lowerInput === '2') {
        const idx = parseInt(lowerInput, 10) - 1;
        targetTask = matchingTasks[idx] || matchingTasks[0];
      } else {
        const listStr = matchingTasks
          .map((t, i) => `${i + 1}. **${t.title}** — Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'}, Status: ${t.status}`)
          .join('\n');
        return {
          text: `I found ${matchingTasks.length} tasks matching "${cleanInput}". Which one would you like to update?\n\n${listStr}\n\nPlease reply with 1 or 2.`,
          action: null,
        };
      }
    }

    if (targetTask) {
      return {
        text: `What would you like to change for task **"${targetTask.title}"**? — title, priority, status, or due date.`,
        action: null,
      };
    }
  }

  // C) CHECK IF ASSISTANT ASKED "What would you like to change for task..." (FIELD SELECTION STAGE)
  if (lastAIText.includes('what would you like to change for task')) {
    for (const t of userTasks) {
      if (lastAIText.includes(t.title.toLowerCase())) {
        targetTask = t;
        break;
      }
    }

    if (targetTask) {
      if (lowerInput === 'title' || lowerInput === 'name' || lowerInput === 'rename') {
        return {
          text: `What new name would you like to give to task **"${targetTask.title}"**?`,
          action: null,
        };
      }

      if (lowerInput === 'priority') {
        return {
          text: `What priority should I set for task **"${targetTask.title}"**? (High, Medium, or Low)`,
          action: null,
        };
      }

      if (lowerInput === 'due' || lowerInput === 'due date' || lowerInput === 'date') {
        return {
          text: `When should task **"${targetTask.title}"** be due? (e.g. Today, Tomorrow, or YYYY-MM-DD)`,
          action: null,
        };
      }

      if (lowerInput === 'status') {
        return {
          text: `What status should I set for task **"${targetTask.title}"**? (To Do, In Progress, or Completed)`,
          action: null,
        };
      }
    }
  }

  // D) CHECK VALUE COLLECTION STAGES ("What new name...", "What priority...", "When should task...", "What status...")
  if (
    lastAIText.includes('what new name would you like to give') ||
    lastAIText.includes('what priority should i set for task') ||
    lastAIText.includes('when should task') ||
    lastAIText.includes('what status should i set for task')
  ) {
    for (const msg of nonWelcomeHistory) {
      const text = (msg.content || msg.text || '').toLowerCase();
      for (const t of userTasks) {
        if (text.includes(t.title.toLowerCase())) {
          targetTask = t;
          break;
        }
      }
      if (targetTask) break;
    }

    if (targetTask) {
      const updates = {};

      if (lastAIText.includes('what new name would you like to give')) {
        let rawNewTitle = cleanInput
          .replace(/^(name it as|set name to|rename to|change name to|change title to)\s+/i, '')
          .trim()
          .replace(/\.+$/, '');
        updates.title = rawNewTitle.charAt(0).toUpperCase() + rawNewTitle.slice(1);
      } else if (lastAIText.includes('what priority should i set for task')) {
        if (lowerInput.includes('high')) updates.priority = 'High';
        else if (lowerInput.includes('low')) updates.priority = 'Low';
        else updates.priority = 'Medium';
      } else if (lastAIText.includes('when should task')) {
        if (lowerInput.includes('tomorrow')) updates.dueDate = getTomorrowDateString();
        else if (lowerInput.includes('today')) updates.dueDate = getLocalDateString();
        else if (cleanInput.match(/\d{4}-\d{2}-\d{2}/)) updates.dueDate = cleanInput.match(/\d{4}-\d{2}-\d{2}/)[0];
        else updates.dueDate = cleanInput;
      } else if (lastAIText.includes('what status should i set for task')) {
        if (lowerInput.includes('completed') || lowerInput.includes('done')) updates.status = 'Completed';
        else if (lowerInput.includes('progress')) updates.status = 'In Progress';
        else updates.status = 'To Do';
      }

      if (Object.keys(updates).length > 0) {
        return {
          text: `I have prepared your task update proposal. Click **Update Task** below to apply changes:`,
          action: {
            type: 'UPDATE_TASK',
            requiresConfirmation: true,
            data: {
              id: targetTask.id || targetTask._id,
              title: targetTask.title,
              updates,
            },
          },
        };
      }
    }
  }

  // E) CHECK DIRECT MULTI-FIELD OR DIRECT TASK MATCH PROMPT
  if (!targetTask) {
    for (const t of userTasks) {
      if (lowerInput.includes(t.title.toLowerCase())) {
        targetTask = t;
        break;
      }
    }
  }

  if (targetTask) {
    const updates = {};

    if (lowerInput.includes('rename') || lowerInput.includes('name it as') || lowerInput.includes('title to') || lowerInput.includes('change name') || lowerInput.includes('change title')) {
      const match = cleanInput.match(/(?:rename|change name of|change title of)\s+.*?\s+to\s+([^\n]+?)(?:\s+and\s+set|\s+set\s+|$)/i) ||
                    cleanInput.match(/(?:name it as|title to|name as)\s+([^\n]+?)(?:\s+and\s+set|\s+set\s+|$)/i);
      if (match) {
        let rawNewTitle = match[1].trim().replace(/\.+$/, '');
        updates.title = rawNewTitle.charAt(0).toUpperCase() + rawNewTitle.slice(1);
      }
    }

    if (lowerInput.includes('priority')) {
      if (lowerInput.includes('high')) updates.priority = 'High';
      else if (lowerInput.includes('low')) updates.priority = 'Low';
      else if (lowerInput.includes('medium')) updates.priority = 'Medium';
    } else if (lowerInput.includes('set low') || lowerInput.includes('set high') || lowerInput.includes('set medium')) {
      if (lowerInput.includes('low')) updates.priority = 'Low';
      else if (lowerInput.includes('high')) updates.priority = 'High';
      else if (lowerInput.includes('medium')) updates.priority = 'Medium';
    }

    if (lowerInput.includes('due')) {
      if (lowerInput.includes('tomorrow')) updates.dueDate = getTomorrowDateString();
      else if (lowerInput.includes('today')) updates.dueDate = getLocalDateString();
      else if (cleanInput.match(/\d{4}-\d{2}-\d{2}/)) updates.dueDate = cleanInput.match(/\d{4}-\d{2}-\d{2}/)[0];
    } else if (cleanInput.match(/\d{4}-\d{2}-\d{2}/)) {
      updates.dueDate = cleanInput.match(/\d{4}-\d{2}-\d{2}/)[0];
    }

    if (lowerInput.includes('completed') || lowerInput.includes('done') || lowerInput.includes('finish')) {
      updates.status = 'Completed';
    } else if (lowerInput.includes('to do') || lowerInput.includes('todo')) {
      updates.status = 'To Do';
    } else if (lowerInput.includes('in progress')) {
      updates.status = 'In Progress';
    }

    if (Object.keys(updates).length > 0) {
      return {
        text: `I have prepared your task update proposal. Click **Update Task** below to apply changes:`,
        action: {
          type: 'UPDATE_TASK',
          requiresConfirmation: true,
          data: {
            id: targetTask.id || targetTask._id,
            title: targetTask.title,
            updates,
          },
        },
      };
    }
  }

  if (userTasks.length === 0) {
    return {
      text: `You currently have no tasks in your workspace to update.`,
      action: null,
    };
  }

  const taskListStr = userTasks.map((t, i) => `${i + 1}. **${t.title}**`).join('\n');
  return {
    text: `Which task would you like to update? Your current tasks are:\n\n${taskListStr}\n\nPlease reply with the task title and what you want to change (title, priority, status, or due date).`,
    action: null,
  };
}

// -------------------------------------------------------------
// STEP 5: AUTHORITATIVE TASK DELETION STATE MACHINE
// -------------------------------------------------------------
function handleTaskDeletionFlow(userMessage, history = [], userTasks = []) {
  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  const revHistory = nonWelcomeHistory.slice().reverse();

  const lastAIMessage = revHistory.find((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  let targetTask = null;

  // A) DISAMBIGUATION RESPONSE: USER REPLIED "1" or "2"
  if (lastAIText.includes('reply with 1 or 2') || (lastAIText.includes('found') && lastAIText.includes('tasks matching'))) {
    let matchedQuery = '';
    for (const msg of revHistory) {
      const txt = (msg.content || msg.text || '').toLowerCase();
      if ((msg.role === 'user' || msg.sender === 'user') && (txt.includes('delete') || userTasks.some(t => txt.includes(t.title.toLowerCase())))) {
        matchedQuery = txt;
        break;
      }
    }

    const matches = userTasks.filter((t) => matchedQuery.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(matchedQuery));
    if (matches.length > 0) {
      const idx = lowerInput === '2' ? 1 : 0;
      targetTask = matches[idx] || matches[0];
    }
  }

  if (!targetTask) {
    const matchingTasks = userTasks.filter(
      (t) => lowerInput.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(lowerInput)
    );

    if (matchingTasks.length === 1) {
      targetTask = matchingTasks[0];
    } else if (matchingTasks.length > 1) {
      if (lowerInput === '1' || lowerInput === '2') {
        const idx = parseInt(lowerInput, 10) - 1;
        targetTask = matchingTasks[idx] || matchingTasks[0];
      } else {
        const listStr = matchingTasks
          .map((t, i) => `${i + 1}. **${t.title}** — Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'}, Status: ${t.status}`)
          .join('\n');
        return {
          text: `I found ${matchingTasks.length} tasks matching "${cleanInput}". Which one would you like to delete?\n\n${listStr}\n\nPlease reply with 1 or 2.`,
          action: null,
        };
      }
    }
  }

  if (!targetTask) {
    if (lastAIText.includes('which task would you like to delete') || lastAIText.includes('specify the task title to confirm deletion')) {
      const historyMatches = userTasks.filter(
        (t) => lowerInput.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(lowerInput)
      );
      if (historyMatches.length === 1) {
        targetTask = historyMatches[0];
      }
    }
  }

  if (targetTask) {
    return {
      text: `Are you sure you want to delete the task **"${targetTask.title}"**? Click **Delete Task** below to confirm:`,
      action: {
        type: 'DELETE_TASK',
        requiresConfirmation: true,
        data: { id: targetTask.id || targetTask._id, title: targetTask.title },
      },
    };
  }

  if (userTasks.length === 0) {
    return {
      text: `You currently have no tasks in your workspace to delete.`,
      action: null,
    };
  }

  const taskListStr = userTasks.map((t, i) => `${i + 1}. **${t.title}**`).join('\n');
  return {
    text: `Which task would you like to delete? Your current tasks are:\n\n${taskListStr}\n\nPlease specify the task title to confirm deletion.`,
    action: null,
  };
}

// -------------------------------------------------------------
// STEP 6: AUTHORITATIVE GOAL CREATION STATE MACHINE
// -------------------------------------------------------------
function handleGoalCreationFlow(userMessage, history = []) {
  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const isGoalTrigger = (text) => {
    const l = text.toLowerCase().trim();
    return (
      l === 'create goal' ||
      l === 'create a goal' ||
      l === 'create the goal' ||
      l === 'add goal' ||
      l === 'add a goal' ||
      l === 'new goal' ||
      l === 'make a goal' ||
      /^(can you\s+)?(help me\s+)?(to\s+)?(create|add|make|set)\s+(a|the|my|new|some)?\s*goal/i.test(l)
    );
  };

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');

  let triggerIndex = -1;
  for (let i = nonWelcomeHistory.length - 1; i >= 0; i--) {
    const msg = nonWelcomeHistory[i];
    if ((msg.role === 'user' || msg.sender === 'user') && isGoalTrigger(msg.content || msg.text || '')) {
      triggerIndex = i;
      break;
    }
  }

  if (isGoalTrigger(cleanInput) || triggerIndex === -1 || triggerIndex === nonWelcomeHistory.length - 1) {
    let directTitle = null;

    if (
      cleanInput.length > 15 &&
      !lowerInput.startsWith('can you help') &&
      !lowerInput.startsWith('i want to') &&
      !lowerInput.startsWith('create a goal') &&
      !lowerInput.startsWith('create the goal') &&
      !lowerInput.startsWith('add a goal')
    ) {
      directTitle = cleanInput.replace(/^(create|add|make)\s+(a|the|my|new|some)?\s*goal\s+(to\s+)?/i, '').trim().replace(/\.+$/, '');
      directTitle = directTitle.charAt(0).toUpperCase() + directTitle.slice(1);
    }

    if (directTitle) {
      return {
        text: `I have prepared your goal proposal. Click **Create Goal** below to add it to your workspace:`,
        action: {
          type: 'CREATE_GOAL',
          requiresConfirmation: true,
          data: {
            title: directTitle,
            description: 'Track objective milestones and team deliverables.',
            progress: 0,
            status: 'Active',
            targetDate: 'September 30, 2026',
            tasksCount: 0,
          },
        },
      };
    }

    return {
      text: `Sure! What would you like the goal to be called?`,
      action: null,
    };
  }

  const activeHistory = nonWelcomeHistory.slice(triggerIndex);
  let title = null;
  let targetDate = null;

  for (let i = 0; i < activeHistory.length; i++) {
    const msg = activeHistory[i];
    const isAssistant = msg.role === 'assistant' || msg.sender === 'ai';
    const text = (msg.content || msg.text || '').toLowerCase();

    if (isAssistant) {
      const nextUserMsg = activeHistory[i + 1];
      if (nextUserMsg && (nextUserMsg.role === 'user' || nextUserMsg.sender === 'user')) {
        const userReply = nextUserMsg.content || nextUserMsg.text || '';

        if (text.includes('goal to be called') || text.includes('goal be called') || text.includes('goal would you like') || text.includes('what would you like the goal')) {
          title = userReply.trim().replace(/\.+$/, '');
        } else if (text.includes('target date') || text.includes('when should')) {
          targetDate = userReply.trim();
        }
      }
    }
  }

  const lastAIMessage = activeHistory.slice().reverse().find((m) => m.role === 'assistant' || m.sender === 'ai');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  if (lastAIText.includes('goal to be called') || lastAIText.includes('goal be called') || lastAIText.includes('goal would you like') || lastAIText.includes('what would you like the goal')) {
    title = cleanInput.replace(/\.+$/, '');
  } else if (lastAIText.includes('target date') || lastAIText.includes('when should')) {
    targetDate = cleanInput;
  }

  if (!title) {
    return { text: `Sure! What would you like the goal to be called?`, action: null };
  }

  if (!targetDate) {
    return { text: `Got it: **"${title}"**. What target date should I set for this goal? (e.g., September 30, 2026, or YYYY-MM-DD)`, action: null };
  }

  return {
    text: `I have prepared your goal proposal. Click **Create Goal** below to add it to your workspace:`,
    action: {
      type: 'CREATE_GOAL',
      requiresConfirmation: true,
      data: {
        title,
        description: 'Track objective milestones and team deliverables.',
        progress: 0,
        status: 'Active',
        targetDate,
        tasksCount: 0,
      },
    },
  };
}

// -------------------------------------------------------------
// STEP 7: AUTHORITATIVE GOAL UPDATE STATE MACHINE
// -------------------------------------------------------------
function handleGoalUpdateFlow(userMessage, history = [], userGoals = []) {
  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  const revHistory = nonWelcomeHistory.slice().reverse();

  const lastAIMessage = revHistory.find((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  let targetGoal = null;

  // A) CHECK IF ASSISTANT PREVIOUSLY ASKED "Which goal would you like to update?"
  if (lastAIText.includes('which goal would you like to update')) {
    const matches = userGoals.filter(
      (g) => lowerInput.includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(lowerInput)
    );

    if (matches.length === 1) {
      targetGoal = matches[0];
    } else if (matches.length > 1) {
      if (lowerInput === '1' || lowerInput === '2') {
        const idx = parseInt(lowerInput, 10) - 1;
        targetGoal = matches[idx] || matches[0];
      } else {
        const listStr = matches.map((g, i) => `${i + 1}. **${g.title}** — Progress: ${g.progress}%, Status: ${g.status}`).join('\n');
        return {
          text: `I found ${matches.length} goals matching "${cleanInput}". Which one would you like to update?\n\n${listStr}\n\nPlease reply with 1 or 2.`,
          action: null,
        };
      }
    }

    if (targetGoal) {
      return {
        text: `What would you like to change for goal **"${targetGoal.title}"**? — title, target date, progress, or status.`,
        action: null,
      };
    }
  }

  // B) FIELD SELECTION STAGE ("What would you like to change for goal...")
  if (lastAIText.includes('what would you like to change for goal')) {
    for (const g of userGoals) {
      if (lastAIText.includes(g.title.toLowerCase())) {
        targetGoal = g;
        break;
      }
    }

    if (targetGoal) {
      if (lowerInput === 'title' || lowerInput === 'name' || lowerInput === 'rename') {
        return {
          text: `What new name would you like to give to goal **"${targetGoal.title}"**?`,
          action: null,
        };
      }

      if (lowerInput === 'progress') {
        return {
          text: `What progress percentage should I set for goal **"${targetGoal.title}"**? (0-100)`,
          action: null,
        };
      }

      if (lowerInput === 'target date' || lowerInput === 'date') {
        return {
          text: `What target date should I set for goal **"${targetGoal.title}"**? (e.g. September 30, 2026)`,
          action: null,
        };
      }

      if (lowerInput === 'status') {
        return {
          text: `What status should I set for goal **"${targetGoal.title}"**? (Active, Completed, or At Risk)`,
          action: null,
        };
      }
    }
  }

  // C) VALUE COLLECTION STAGE
  if (
    lastAIText.includes('what new name would you like to give to goal') ||
    lastAIText.includes('what progress percentage') ||
    lastAIText.includes('target date should i set for goal') ||
    lastAIText.includes('what status should i set for goal')
  ) {
    for (const msg of nonWelcomeHistory) {
      const text = (msg.content || msg.text || '').toLowerCase();
      for (const g of userGoals) {
        if (text.includes(g.title.toLowerCase())) {
          targetGoal = g;
          break;
        }
      }
      if (targetGoal) break;
    }

    if (targetGoal) {
      const updates = {};

      if (lastAIText.includes('what new name would you like to give to goal')) {
        let rawNewTitle = cleanInput.replace(/^(name it as|set name to|rename to|change name to|change title to)\s+/i, '').trim().replace(/\.+$/, '');
        updates.title = rawNewTitle.charAt(0).toUpperCase() + rawNewTitle.slice(1);
      } else if (lastAIText.includes('what progress percentage')) {
        const val = parseInt(cleanInput.replace(/\D/g, ''), 10);
        updates.progress = isNaN(val) ? 50 : Math.min(100, Math.max(0, val));
      } else if (lastAIText.includes('target date should i set for goal')) {
        updates.targetDate = cleanInput;
      } else if (lastAIText.includes('what status should i set for goal')) {
        if (lowerInput.includes('completed')) updates.status = 'Completed';
        else if (lowerInput.includes('risk')) updates.status = 'At Risk';
        else updates.status = 'Active';
      }

      if (Object.keys(updates).length > 0) {
        return {
          text: `I have prepared your goal update proposal. Click **Update Goal** below to apply changes:`,
          action: {
            type: 'UPDATE_GOAL',
            requiresConfirmation: true,
            data: {
              id: targetGoal.id || targetGoal._id,
              title: targetGoal.title,
              updates,
            },
          },
        };
      }
    }
  }

  // D) DIRECT MATCH PROMPT
  if (!targetGoal) {
    for (const g of userGoals) {
      if (lowerInput.includes(g.title.toLowerCase())) {
        targetGoal = g;
        break;
      }
    }
  }

  if (targetGoal) {
    const updates = {};
    if (lowerInput.includes('rename') || lowerInput.includes('title')) {
      const match = cleanInput.match(/(?:rename|change title of|change name of)\s+.*?\s+to\s+([^\n]+)/i);
      if (match) {
        let rawTitle = match[1].trim().replace(/\.+$/, '');
        updates.title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      }
    }

    if (lowerInput.includes('progress')) {
      const val = parseInt(cleanInput.replace(/\D/g, ''), 10);
      if (!isNaN(val)) updates.progress = Math.min(100, Math.max(0, val));
    }

    if (Object.keys(updates).length > 0) {
      return {
        text: `I have prepared your goal update proposal. Click **Update Goal** below to apply changes:`,
        action: {
          type: 'UPDATE_GOAL',
          requiresConfirmation: true,
          data: {
            id: targetGoal.id || targetGoal._id,
            title: targetGoal.title,
            updates,
          },
        },
      };
    }
  }

  if (userGoals.length === 0) {
    return {
      text: `You currently have no goals in your workspace to update.`,
      action: null,
    };
  }

  const goalListStr = userGoals.map((g, i) => `${i + 1}. **${g.title}**`).join('\n');
  return {
    text: `Which goal would you like to update? Your current goals are:\n\n${goalListStr}\n\nPlease reply with the goal title and what you want to change (title, target date, progress, or status).`,
    action: null,
  };
}

// -------------------------------------------------------------
// STEP 8: AUTHORITATIVE GOAL DELETION STATE MACHINE
// -------------------------------------------------------------
function handleGoalDeletionFlow(userMessage, history = [], userGoals = []) {
  const cleanInput = userMessage.trim();
  const lowerInput = cleanInput.toLowerCase();

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  const revHistory = nonWelcomeHistory.slice().reverse();

  const lastAIMessage = revHistory.find((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const lastAIText = lastAIMessage ? (lastAIMessage.content || lastAIMessage.text || '').toLowerCase() : '';

  let targetGoal = null;

  const matches = userGoals.filter(
    (g) => lowerInput.includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(lowerInput)
  );

  if (matches.length === 1) {
    targetGoal = matches[0];
  } else if (matches.length > 1) {
    if (lowerInput === '1' || lowerInput === '2') {
      const idx = parseInt(lowerInput, 10) - 1;
      targetGoal = matches[idx] || matches[0];
    } else {
      const listStr = matches.map((g, i) => `${i + 1}. **${g.title}** — Progress: ${g.progress}%, Status: ${g.status}`).join('\n');
      return {
        text: `I found ${matches.length} goals matching "${cleanInput}". Which one would you like to delete?\n\n${listStr}\n\nPlease reply with 1 or 2.`,
        action: null,
      };
    }
  }

  if (!targetGoal) {
    if (lastAIText.includes('which goal would you like to delete') || lastAIText.includes('specify the goal title to confirm deletion')) {
      const historyMatches = userGoals.filter(
        (g) => lowerInput.includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(lowerInput)
      );
      if (historyMatches.length === 1) {
        targetGoal = historyMatches[0];
      }
    }
  }

  if (targetGoal) {
    return {
      text: `Are you sure you want to delete the goal **"${targetGoal.title}"**? Click **Delete Goal** below to confirm:`,
      action: {
        type: 'DELETE_GOAL',
        requiresConfirmation: true,
        data: { id: targetGoal.id || targetGoal._id, title: targetGoal.title },
      },
    };
  }

  if (userGoals.length === 0) {
    return {
      text: `You currently have no goals in your workspace to delete.`,
      action: null,
    };
  }

  const goalListStr = userGoals.map((g, i) => `${i + 1}. **${g.title}**`).join('\n');
  return {
    text: `Which goal would you like to delete? Your current goals are:\n\n${goalListStr}\n\nPlease specify the goal title to confirm deletion.`,
    action: null,
  };
}

// -------------------------------------------------------------
// STEP 9: TECHNICAL TOPIC CONTEXT EXTRACTOR & QUIZ ENGINE
// -------------------------------------------------------------
function extractTechnicalTopic(userMessage, history = []) {
  const cleanInput = userMessage.trim().toLowerCase();

  if (cleanInput.includes('mysql')) return 'MySQL';
  if (cleanInput.includes('python')) return 'Python';
  if (cleanInput.includes('java') && !cleanInput.includes('javascript')) return 'Java';
  if (cleanInput.includes('javascript') || cleanInput.includes('js')) return 'JavaScript';
  if (cleanInput.includes('react')) return 'React';
  if (cleanInput.includes('sql') || cleanInput.includes('join') || cleanInput.includes('index') || cleanInput.includes('primary key') || cleanInput.includes('normalization')) return 'SQL & Databases';

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');
  for (let i = nonWelcomeHistory.length - 1; i >= 0; i--) {
    const text = (nonWelcomeHistory[i].content || nonWelcomeHistory[i].text || '').toLowerCase();
    if (text.includes('mysql')) return 'MySQL';
    if (text.includes('python')) return 'Python';
    if (text.includes('java') && !text.includes('javascript')) return 'Java';
    if (text.includes('javascript') || text.includes('js')) return 'JavaScript';
    if (text.includes('react')) return 'React';
    if (text.includes('sql') || text.includes('join') || text.includes('index') || text.includes('primary key') || text.includes('normalization')) return 'SQL & Databases';
  }

  return 'SQL & Databases';
}

const QUIZ_POOLS = {
  'SQL & Databases': [
    {
      q: 'Which SQL clause is used to filter rows BEFORE grouping is applied?',
      options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'],
      correct: 'B',
      explanation: '`WHERE` filters individual rows **before** `GROUP BY` is applied. `HAVING` filters aggregated groups **after** grouping.',
    },
    {
      q: 'Which JOIN returns only matching rows present in both tables?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN'],
      correct: 'C',
      explanation: '`INNER JOIN` returns rows only when there is a matching key in both joining tables.',
    },
    {
      q: 'How does MySQL handle FULL OUTER JOINs given that native `FULL OUTER JOIN` syntax is not supported?',
      options: ['Using `FULL JOIN` keyword', 'Using `OUTER JOIN` keyword', 'Emulating using `LEFT JOIN` and `RIGHT JOIN` with `UNION`'],
      correct: 'C',
      explanation: 'MySQL does not support native `FULL OUTER JOIN` syntax; developers emulate it by combining a `LEFT JOIN` and a `RIGHT JOIN` using `UNION`.',
    },
    {
      q: 'Which database object speeds up data retrieval queries from O(N) to O(log N) at the cost of write overhead?',
      options: ['View', 'Trigger', 'Index', 'Stored Procedure'],
      correct: 'C',
      explanation: 'An Index (typically B-Tree) speeds up read queries but requires updates on `INSERT`, `UPDATE`, and `DELETE` operations.',
    },
    {
      q: "What does the 'A' in database ACID compliance stand for?",
      options: ['Accuracy', 'Atomicity', 'Availability', 'Authorization'],
      correct: 'B',
      explanation: 'Atomicity guarantees that all operations within a transaction complete successfully, or all are rolled back.',
    },
  ],
  'MySQL': [
    {
      q: 'Which SQL clause is used to filter rows BEFORE grouping is applied?',
      options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'],
      correct: 'B',
      explanation: '`WHERE` filters individual rows **before** `GROUP BY` is applied. `HAVING` filters aggregated groups **after** grouping.',
    },
    {
      q: 'Which JOIN returns only matching rows present in both tables?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN'],
      correct: 'C',
      explanation: '`INNER JOIN` returns rows only when there is a matching key in both joining tables.',
    },
    {
      q: 'How does MySQL handle FULL OUTER JOINs given that native `FULL OUTER JOIN` syntax is not supported?',
      options: ['Using `FULL JOIN` keyword', 'Using `OUTER JOIN` keyword', 'Emulating using `LEFT JOIN` and `RIGHT JOIN` with `UNION`'],
      correct: 'C',
      explanation: 'MySQL does not support native `FULL OUTER JOIN` syntax; developers emulate it by combining a `LEFT JOIN` and a `RIGHT JOIN` using `UNION`.',
    },
    {
      q: 'Which database object speeds up data retrieval queries from O(N) to O(log N) at the cost of write overhead?',
      options: ['View', 'Trigger', 'Index', 'Stored Procedure'],
      correct: 'C',
      explanation: 'An Index (typically B-Tree) speeds up read queries but requires updates on `INSERT`, `UPDATE`, and `DELETE` operations.',
    },
    {
      q: "What does the 'A' in database ACID compliance stand for?",
      options: ['Accuracy', 'Atomicity', 'Availability', 'Authorization'],
      correct: 'B',
      explanation: 'Atomicity guarantees that all operations within a transaction complete successfully, or all are rolled back.',
    },
  ],
  'Python': [
    {
      q: 'Which built-in Python data structure is mutable and maintains insertion order?',
      options: ['Tuple', 'Set', 'List', 'Frozenset'],
      correct: 'C',
      explanation: 'A `list` in Python is mutable and maintains insertion order.',
    },
    {
      q: 'What does a decorator function in Python take as its primary argument?',
      options: ['A string', 'Another function', 'A class instance', 'A dictionary'],
      correct: 'B',
      explanation: 'A Python decorator is a higher-order function that takes another function as an argument and extends its behavior.',
    },
    {
      q: 'Which keyword is used for context managers to handle resource cleanup safely (e.g., file I/O)?',
      options: ['try', 'with', 'finally', 'using'],
      correct: 'B',
      explanation: 'The `with` statement simplifies exception handling by encapsulating common cleanup tasks.',
    },
  ],
  'Java': [
    {
      q: 'Which OOP concept in Java allows a method in a subclass to override a method in its superclass?',
      options: ['Method Overloading', 'Method Overriding', 'Encapsulation', 'Abstraction'],
      correct: 'B',
      explanation: 'Method Overriding occurs when a subclass provides a specific implementation of a method declared in its superclass.',
    },
    {
      q: 'Which Java memory area stores objects and instance variables created during runtime?',
      options: ['Stack', 'Heap', 'Method Area', 'PC Register'],
      correct: 'B',
      explanation: 'The Heap memory area in JVM is used to store objects and JRE classes.',
    },
  ],
};

function handleInteractiveQuiz(userMessage, history = []) {
  const topic = extractTechnicalTopic(userMessage, history);
  const pool = QUIZ_POOLS[topic] || QUIZ_POOLS['SQL & Databases'];

  const nonWelcomeHistory = history.filter((m) => m.content !== 'welcome');

  let askedCount = 0;
  for (const m of nonWelcomeHistory) {
    const text = m.content || m.text || '';
    if ((m.role === 'assistant' || m.sender === 'ai') && text.includes('### Question')) {
      askedCount++;
    }
  }

  const cleanInput = userMessage.trim().toUpperCase();
  let userChoice = null;

  if (cleanInput.includes('A') || cleanInput.includes('1')) userChoice = 'A';
  else if (cleanInput.includes('B') || cleanInput.includes('2')) userChoice = 'B';
  else if (cleanInput.includes('C') || cleanInput.includes('3')) userChoice = 'C';
  else if (cleanInput.includes('D') || cleanInput.includes('4')) userChoice = 'D';

  if (askedCount === 0 || !userChoice) {
    const q1 = pool[0];
    const optStr = q1.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
    return `Let's test your ${topic} knowledge! 🎯

### Question 1

${q1.q}

${optStr}

Please reply with **A, B, C, or D**.`;
  }

  const currentQIndex = Math.min(askedCount - 1, pool.length - 1);
  const currentQ = pool[currentQIndex];

  const isCorrect = userChoice === currentQ.correct;
  let feedback = isCorrect
    ? `Correct! ✅\n\n${currentQ.explanation}`
    : `Incorrect. ❌ The correct answer is **${currentQ.correct}**.\n\n${currentQ.explanation}`;

  const nextQIndex = currentQIndex + 1;
  if (nextQIndex < pool.length) {
    const nextQ = pool[nextQIndex];
    const optStr = nextQ.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
    return `${feedback}\n\n---\n\n### Question ${nextQIndex + 1}\n\n${nextQ.q}\n\n${optStr}\n\nPlease reply with **A, B, C, or D**.`;
  }

  return `${feedback}\n\n---\n\n🎉 **Quiz Complete!** You have finished the ${topic} quiz! Let me know if you would like to start another quiz or explore technical roadmaps.`;
}

// -------------------------------------------------------------
// STEP 10: DYNAMIC TECHNICAL LEARNING FALLBACK ENGINE
// -------------------------------------------------------------
function handleTechnicalFallback(userMessage, history = [], intentObj = {}) {
  const cleanInput = userMessage.trim().toLowerCase();
  const topic = extractTechnicalTopic(userMessage, history);

  if (intentObj.intent === 'TECHNICAL_QUIZ') {
    return handleInteractiveQuiz(userMessage, history);
  }

  if (intentObj.intent === 'TECHNICAL_ROADMAP') {
    if (topic === 'MySQL' || topic === 'SQL & Databases') {
      return `### 🐬 Structured ${topic} Learning Roadmap

#### Phase 1: Database Fundamentals & Architecture (Week 1)
- Relational Database Concepts, Tables, Rows, Columns, and Data Types
- Primary Keys, Foreign Keys, and Referential Integrity

#### Phase 2: CRUD & Querying (Week 2)
- Basic SQL: \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`
- Filtering & Sorting: \`WHERE\`, \`ORDER BY\`, \`LIMIT\`, \`LIKE\`

#### Phase 3: Joins & Aggregations (Week 3)
- Table Relationships: \`INNER JOIN\`, \`LEFT JOIN\`, \`RIGHT JOIN\`
- *(Note: MySQL does not support native \`FULL OUTER JOIN\` syntax; emulate using \`LEFT JOIN\` and \`RIGHT JOIN\` with \`UNION\`)*
- Aggregations: \`GROUP BY\`, \`HAVING\`, \`COUNT()\`, \`SUM()\`, \`AVG()\`

#### Phase 4: Performance & Optimization (Week 4)
- Indexing (B-Tree indexes, composite indexes) & \`EXPLAIN\` query analysis
- Transactions, ACID compliance, and Isolation Levels

#### Phase 5: Real-World Practice
- Build multi-table schemas and solve complex query challenges.`;
    }

    if (topic === 'Python') {
      return `### 🐍 Structured Python Learning Roadmap

#### Phase 1: Python Basics (Week 1)
- Variables, Data Types (\`str\`, \`int\`, \`float\`, \`bool\`)
- Control Flow (\`if\`, \`elif\`, \`else\`, \`for\`, \`while\` loops)

#### Phase 2: Data Structures & Functions (Week 2)
- Collections (\`list\`, \`tuple\`, \`dict\`, \`set\`)
- Writing Functions, \`*args\`, \`**kwargs\`, and Lambda functions

#### Phase 3: Object-Oriented Programming (Week 3)
- Classes, Objects, Inheritance, Encapsulation, and Polymorphism

#### Phase 4: Modules & Ecosystem (Week 4)
- File I/O, Exception Handling (\`try/except\`)
- Packages (\`pip\`, \`virtualenv\`) and popular libraries (\`requests\`, \`pytest\`, \`pandas\`)

#### Phase 5: Projects & Interview Prep
- Build CLI utilities, REST APIs with FastAPI/Flask, and solve algorithmic challenges.`;
    }

    return `### 🚀 Structured ${topic} Learning Roadmap

#### Phase 1: Core Fundamentals (Week 1)
- Syntax, Data Types, Variables, and Control Flow Structures

#### Phase 2: Intermediate Concepts (Week 2)
- Modular Programming, Functions, Data Structures, and Design Patterns

#### Phase 3: Advanced Topics & Architecture (Week 3)
- Async Programming, Memory Management, Performance Optimization

#### Phase 4: Practical Projects & System Building (Week 4)
- End-to-end Project Development, Unit Testing, and CI/CD Integration.`;
  }

  if (intentObj.intent === 'TECHNICAL_INTERVIEW') {
    return `### 📝 Top ${topic} Interview Questions & Preparation Guide

#### 1. What is the difference between \`WHERE\` and \`HAVING\` in SQL?
- **\`WHERE\`** filters individual rows **before** aggregation.
- **\`HAVING\`** filters aggregated groups **after** \`GROUP BY\`.

#### 2. What is an \`INNER JOIN\` vs \`LEFT JOIN\`?
- **\`INNER JOIN\`** returns rows only when there is a match in both tables.
- **\`LEFT JOIN\`** returns all rows from the left table and matched rows from the right table.

#### 3. How does MySQL perform a Full Outer Join?
- MySQL does not support native \`FULL OUTER JOIN\` syntax. It is emulated by combining a \`LEFT JOIN\` and a \`RIGHT JOIN\` using \`UNION\`.

#### 4. What are ACID properties in Database Management?
- **Atomicity**, **Consistency**, **Isolation**, **Durability**.

#### 5. Sample Query Question:
\`\`\`sql
SELECT dept_id, COUNT(*) AS emp_count 
FROM Employees 
GROUP BY dept_id 
HAVING COUNT(*) > 5;
\`\`\``;
  }

  if (intentObj.intent === 'TECHNICAL_EXAMPLE' || cleanInput.includes('example')) {
    if (topic === 'MySQL' || topic === 'SQL & Databases') {
      return `### 💡 ${topic} Code Example

Here is a practical SQL query demonstrating table joins and aggregations:

\`\`\`sql
SELECT 
    d.dept_name,
    COUNT(e.emp_id) AS total_employees,
    AVG(e.salary) AS average_salary
FROM departments d
INNER JOIN employees e 
    ON d.dept_id = e.dept_id
WHERE e.status = 'Active'
GROUP BY d.dept_name
HAVING COUNT(e.emp_id) > 2
ORDER BY average_salary DESC;
\`\`\`

#### Key Highlights:
- **\`INNER JOIN\`**: Links \`departments\` and \`employees\` on \`dept_id\`.
- **\`WHERE\`**: Filters active employees prior to grouping.
- **\`HAVING\`**: Filters department groups with more than 2 employees.`;
    }

    if (topic === 'Python') {
      return `### 🐍 Python Decorator Example

\`\`\`python
import time

def timer_decorator(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"Function {func.__name__} executed in {end_time - start_time:.4f}s")
        return result
    return wrapper

@timer_decorator
def process_data(limit):
    return sum(i * i for i in range(limit))

process_data(1000000)
\`\`\``;
    }
  }

  if (intentObj.intent === 'TECHNICAL_FOLLOWUP') {
    if (topic === 'MySQL') {
      return `### 🐬 Why MySQL is Popular in Production Backend Systems

1. **Proven Performance & Reliability**: Handles high-concurrency read queries efficiently using the **InnoDB** storage engine.
2. **ACID Compliance**: Provides full transaction support for business-critical applications.
3. **Ecosystem & Community**: Integrated with popular stacks such as **LAMP**, **PERN (PostgreSQL/MySQL)**, and modern backends (**Node.js**, **Spring Boot**, **FastAPI**).
4. **Horizontal Scaling**: Supports replication (Master-Slave / Primary-Replica) and sharding.`;
    }
  }

  if (cleanInput.includes('inner join') || (cleanInput.includes('join') && cleanInput.includes('employee'))) {
    return `### 💡 INNER JOIN Explanation & Employee Example

An **INNER JOIN** selects records that have matching values in both tables.

#### SQL Example:
\`\`\`sql
SELECT Employees.emp_id, Employees.name, Departments.dept_name
FROM Employees
INNER JOIN Departments ON Employees.dept_id = Departments.dept_id;
\`\`\`

#### Explanation:
- Records are returned **only** if an employee's \`dept_id\` matches a valid \`dept_id\` in the \`Departments\` table.`;
  }

  if (cleanInput.includes('primary key')) {
    return `### 🔑 Primary Key in Databases

A **Primary Key** is a column (or set of columns) that uniquely identifies each row in a database table.

#### Key Rules:
1. Must contain **unique** values for every row.
2. Cannot contain \`NULL\` values.
3. Each table can have **only one** Primary Key.

#### Example:
\`\`\`sql
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE
);
\`\`\``;
  }

  if (cleanInput.includes('index') || cleanInput.includes('indexes')) {
    return `### ⚡ Why Do We Use Indexes in Databases?

An **Index** is a data structure (typically a **B-Tree**) used by database engines to rapidly locate rows without scanning the entire table.

#### Key Benefits:
- **Fast Queries**: Reduces query lookup time from **O(N)** full table scans to **O(log N)** B-Tree searches.
- **Enforces Uniqueness**: Unique indexes enforce unique column constraints.

#### Trade-offs:
- **Write Overhead**: \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations require updating the index structure.
- **Storage**: Indexes consume disk space.`;
  }

  if (cleanInput.includes('polymorphism')) {
    return `### ☕ Polymorphism in Java

**Polymorphism** allows an object to take on many forms. It enables a parent class reference to hold a child class object.

#### 1. Compile-Time Polymorphism (Method Overloading)
\`\`\`java
class Calculator {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
}
\`\`\`

#### 2. Run-Time Polymorphism (Method Overriding)
\`\`\`java
class Animal {
    void makeSound() { System.out.println("Animal makes a sound"); }
}
class Dog extends Animal {
    @Override
    void makeSound() { System.out.println("Dog barks"); }
}
\`\`\``;
  }

  if (cleanInput.includes('decorator')) {
    return `### 🐍 Python Decorators Explained

A **decorator** is a design pattern in Python used to extend or modify the behavior of a function or class without modifying its source code.

#### Syntax & Example:
\`\`\`python
def log_execution(func):
    def wrapper(*args, **kwargs):
        print(f"Executing {func.__name__}...")
        result = func(*args, **kwargs)
        print("Execution complete.")
        return result
    return wrapper

@log_execution
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
\`\`\``;
  }

  if (cleanInput.includes('async') || cleanInput.includes('await')) {
    return `### ⚡ Async / Await in JavaScript

\`async\` and \`await\` provide a clean, synchronous-looking syntax for writing asynchronous, promise-based code in JavaScript.

#### Example:
\`\`\`javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
\`\`\``;
  }

  if (cleanInput.includes('what is mysql') || cleanInput === 'mysql') {
    return `### 🐬 What is MySQL?

**MySQL** is an open-source **Relational Database Management System (RDBMS)** developed by Oracle. It stores data in structured tables consisting of rows and columns and uses **SQL (Structured Query Language)** to execute database operations.

#### Key Features:
- **Relational Model**: Organizes data into related tables connected by Foreign Keys.
- **ACID Compliance**: Ensures reliable transactions (Atomicity, Consistency, Isolation, Durability).
- **High Performance & Scalability**: Supports indexing (B-Tree), query optimization, and replication.
- **Widespread Adoption**: Used in web applications, microservices, and enterprise stacks (LAMP, Node.js, Spring Boot, FastAPI).`;
  }

  if (cleanInput.includes('what is python') || cleanInput === 'python') {
    return `### 🐍 What is Python?

**Python** is a high-level, interpreted, dynamically-typed programming language designed for readability and developer productivity.

#### Key Strengths:
- **Readable Syntax**: Clean, indentation-based syntax.
- **Rich Ecosystem**: Extensive standard library and packages for Web Development (Django/FastAPI), Data Science (Pandas/NumPy), and AI/ML (PyTorch/TensorFlow).`;
  }

  const topicTitle = userMessage.trim().replace(/^what is\s+/i, '').replace(/^explain\s+/i, '');
  return `### 💡 Technical Deep-Dive: ${topicTitle.charAt(0).toUpperCase() + topicTitle.slice(1)}

Here is a structured technical breakdown for **${topicTitle}**:

- **Core Concept**: Represents a fundamental software engineering concept designed for performance, maintainability, and scalability.
- **Key Principles**: Clean separation of concerns, modular design, and robust implementation patterns.
- **Practical Application**: Widely applied across backend services, database management systems, and technical interviews.`;
}

function buildSystemInstruction(intentObj) {
  const todayStr = getLocalDateString();

  return `You are FlowMind AI, an expert technical mentor and software engineering assistant.
Today's local date is ${todayStr}.
User Intent: ${intentObj.intent}

TECHNICAL ACCURACY RULES (CRITICAL):
1. FACTUAL ACCURACY:
   - NEVER claim MySQL is part of the standard MERN stack. (MERN = MongoDB, Express, React, Node).
   - MySQL does NOT support native "FULL OUTER JOIN" syntax. Explain accurately that MySQL emulates full outer joins using "LEFT JOIN" and "RIGHT JOIN" with "UNION".
   - Distinguish MySQL-specific capabilities from standard ANSI SQL.
2. INTERACTIVE QUIZ BEHAVIOR:
   - If user asks to "quiz me", start an interactive quiz with Question 1 and multiple-choice options A, B, C, D.
   - Do NOT return a static list of interview questions for a quiz request.
3. CONVERSATION CONTEXT:
   - Maintain the active technical topic (e.g. MySQL, Python, Java) across follow-up turns ("Why is it popular?", "Give me an example", "Quiz me").
4. CODE BLOCK RENDERING:
   - Always wrap code snippets in clean fenced Markdown code blocks with explicit language specifiers (\`\`\`sql, \`\`\`python, \`\`\`java, \`\`\`javascript).`;
}

function buildPromptWithSelectedContext(userMessage, tasks, goals, history = [], intentObj) {
  let contextStr = '';
  if (tasks.length > 0) {
    const taskDetails = tasks.map((t) => `- "${t.title}" [Priority: ${t.priority}, Status: ${t.status}, Due: ${t.dueDate || 'N/A'}]`);
    contextStr += `User Tasks (${tasks.length}):\n${taskDetails.join('\n')}\n\n`;
  }

  if (goals.length > 0) {
    const goalDetails = goals.map((g) => `- "${g.title}" [Progress: ${g.progress}%, Status: ${g.status}]`);
    contextStr += `User Goals (${goals.length}):\n${goalDetails.join('\n')}\n\n`;
  }

  const pastMessages = history
    .slice(-30)
    .map((m) => {
      const roleName = m.role === 'assistant' || m.sender === 'ai' ? 'Assistant' : 'User';
      const text = m.content || m.text || '';
      return `${roleName}: ${text}`;
    })
    .join('\n');

  return `${contextStr ? `WORK CONTEXT:\n${contextStr}` : ''}CONVERSATION HISTORY:\n${pastMessages}\n\nUser Latest Message: "${userMessage}"`;
}

function parseActionFromResponse(rawText) {
  if (!rawText) return { text: '', action: null };

  const actionRegex = /```json:action\s*([\s\S]*?)\s*```/;
  const match = rawText.match(actionRegex);

  if (match) {
    try {
      const actionObj = JSON.parse(match[1].trim());
      const cleanText = rawText.replace(actionRegex, '').trim();
      return { text: cleanText, action: actionObj };
    } catch (e) {
      console.warn('[aiService] Action JSON parse failed:', e.message);
    }
  }

  return { text: rawText.trim(), action: null };
}

// -------------------------------------------------------------
// MAIN AUTHORITATIVE AI SERVICE PIPELINE
// -------------------------------------------------------------
export const aiService = {
  async generateChatResponse(userId, userMessage, history = []) {
    const userTasks = await taskService.getAllTasks(userId);
    const userGoals = await goalService.getAllGoals(userId);

    const intentObj = classifyIntent(userMessage, history);

    if (intentObj.intent === 'CANCEL_OPERATION') {
      return {
        text: `Operation cancelled. Let me know if you need help with tasks, goals, or technical learning topics!`,
        action: null,
        intent: 'CANCEL_OPERATION',
        isFallback: false,
        provider: 'local-orchestrated',
      };
    }

    if (intentObj.intent === 'GENERIC_TASK_HELP') {
      return {
        text: `Sure — what would you like to do with a task or goal? You can create, view, update, or delete tasks and goals.`,
        action: null,
        intent: 'GENERIC_TASK_HELP',
        isFallback: false,
        provider: 'local-orchestrated',
      };
    }

    if (intentObj.intent === 'GENERAL_CONVERSATION') {
      const cleanInput = userMessage.trim().toLowerCase();
      let responseText = `Hi! 👋 I'm FlowMind AI. How can I help you today?`;
      if (cleanInput.includes('how are you')) {
        responseText = `I'm doing great, thank you! How are you doing today? Let me know if you need help with tasks, goals, or technical learning topics.`;
      } else if (cleanInput.includes('thanks') || cleanInput.includes('thank you')) {
        responseText = `You're very welcome! Let me know if you need help with anything else.`;
      }

      return {
        text: responseText,
        action: null,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'local-orchestrated',
      };
    }

    if (intentObj.intent === 'TASK_QUERY') {
      const cleanInput = userMessage.trim().toLowerCase();
      const todayStr = getLocalDateString();

      let targetTasks = userTasks;
      let filterTitle = 'tasks';

      if (cleanInput.includes('due today') || cleanInput.includes('today')) {
        targetTasks = userTasks.filter((t) => t.dueDate === todayStr || t.dueDate === 'Today');
        filterTitle = 'tasks due today';
      } else if (cleanInput.includes('completed')) {
        targetTasks = userTasks.filter((t) => t.status === 'Completed');
        filterTitle = 'completed tasks';
      } else if (cleanInput.includes('urgent') || cleanInput.includes('work on first') || cleanInput.includes('work on now')) {
        targetTasks = userTasks.filter((t) => t.status !== 'Completed' && t.priority === 'High');
        if (targetTasks.length === 0) targetTasks = userTasks.filter((t) => t.status !== 'Completed');
        filterTitle = 'top priority pending tasks';
      }

      if (targetTasks.length === 0) {
        return {
          text: `You currently have no ${filterTitle} in your workspace.`,
          action: null,
          intent: 'TASK_QUERY',
          isFallback: false,
          provider: 'workspace-engine',
        };
      }

      const formattedList = targetTasks
        .map((t, idx) => `${idx + 1}. **${t.title}**\n   - Priority: ${t.priority}\n   - Status: ${t.status}\n   - Due: ${t.dueDate || 'N/A'}`)
        .join('\n\n');

      return {
        text: `You currently have ${targetTasks.length} ${filterTitle}:\n\n${formattedList}`,
        action: null,
        intent: 'TASK_QUERY',
        isFallback: false,
        provider: 'workspace-engine',
      };
    }

    if (intentObj.intent === 'GOAL_QUERY') {
      const cleanInput = userMessage.trim().toLowerCase();
      let targetGoals = userGoals;
      let filterTitle = 'goals';

      if (cleanInput.includes('active')) {
        targetGoals = userGoals.filter((g) => g.status === 'Active');
        filterTitle = 'active goals';
      } else if (cleanInput.includes('completed')) {
        targetGoals = userGoals.filter((g) => g.status === 'Completed');
        filterTitle = 'completed goals';
      }

      if (targetGoals.length === 0) {
        return {
          text: `You currently have no ${filterTitle} in your workspace.`,
          action: null,
          intent: 'GOAL_QUERY',
          isFallback: false,
          provider: 'workspace-engine',
        };
      }

      const formattedList = targetGoals
        .map((g, idx) => `${idx + 1}. **${g.title}**\n   - Status: ${g.status}\n   - Progress: ${g.progress}%`)
        .join('\n\n');

      return {
        text: `You currently have ${targetGoals.length} ${filterTitle}:\n\n${formattedList}`,
        action: null,
        intent: 'GOAL_QUERY',
        isFallback: false,
        provider: 'workspace-engine',
      };
    }

    if (intentObj.intent === 'PRODUCTIVITY_ANALYSIS') {
      const cleanInput = userMessage.trim().toLowerCase();
      const isSummaryRequest = cleanInput.includes('summarize') || cleanInput.includes('summary');

      const total = userTasks.length;
      const completed = userTasks.filter((t) => t.status === 'Completed').length;
      const pending = userTasks.filter((t) => t.status !== 'Completed').length;
      const todayStr = getLocalDateString();
      const overdue = userTasks.filter((t) => t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr && t.dueDate !== 'Today').length;
      const highPriority = userTasks.filter((t) => t.status !== 'Completed' && t.priority === 'High').length;
      const mediumPriority = userTasks.filter((t) => t.status !== 'Completed' && t.priority === 'Medium').length;

      if (isSummaryRequest) {
        const urgentTask = userTasks.find((t) => t.status !== 'Completed' && t.priority === 'High') || userTasks.find((t) => t.status !== 'Completed');
        const urgentMsg = urgentTask ? `\n\n💡 **Top Recommended Focus**: **"${urgentTask.title}"** (${urgentTask.priority} priority, Due: ${urgentTask.dueDate || 'N/A'}).` : '';

        return {
          text: `### 📊 Workspace Task & Goal Summary

- **Total Tasks**: ${total}
- **Completed Tasks**: ${completed}
- **Pending Tasks**: ${pending} (High: ${highPriority}, Medium: ${mediumPriority})
- **Active Goals**: ${userGoals.filter((g) => g.status === 'Active').length}${urgentMsg}`,
          action: null,
          intent: 'PRODUCTIVITY_ANALYSIS',
          isFallback: false,
          provider: 'workspace-engine',
        };
      }

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        text: `### 📊 Workspace Productivity Summary

- **Total Tasks**: ${total}
- **Completed Tasks**: ${completed}
- **Pending Tasks**: ${pending}
- **Overdue Tasks**: ${overdue}
- **Completion Rate**: ${completionRate}%
- **Active Goals**: ${userGoals.filter((g) => g.status === 'Active').length}`,
        action: null,
        intent: 'PRODUCTIVITY_ANALYSIS',
        isFallback: false,
        provider: 'workspace-engine',
      };
    }

    if (intentObj.intent === 'TASK_CREATION') {
      const flowResult = handleTaskCreationFlow(userMessage, history);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    if (intentObj.intent === 'TASK_UPDATE') {
      const flowResult = handleTaskUpdateFlow(userMessage, history, userTasks);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    if (intentObj.intent === 'TASK_DELETION') {
      const flowResult = handleTaskDeletionFlow(userMessage, history, userTasks);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    if (intentObj.intent === 'GOAL_CREATION') {
      const flowResult = handleGoalCreationFlow(userMessage, history);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    if (intentObj.intent === 'GOAL_UPDATE') {
      const flowResult = handleGoalUpdateFlow(userMessage, history, userGoals);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    if (intentObj.intent === 'GOAL_DELETION') {
      const flowResult = handleGoalDeletionFlow(userMessage, history, userGoals);
      return {
        text: flowResult.text,
        action: flowResult.action,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'orchestrated-flow',
      };
    }

    // HANDLER FOR INTERACTIVE TECHNICAL QUIZ INTENT
    if (intentObj.intent === 'TECHNICAL_QUIZ') {
      return {
        text: handleInteractiveQuiz(userMessage, history),
        action: null,
        intent: intentObj.intent,
        isFallback: false,
        provider: 'quiz-engine',
      };
    }

    const selected = selectContext(intentObj.intent, userTasks, userGoals);
    const isApiKeyConfigured =
      config.geminiApiKey &&
      config.geminiApiKey.trim() !== '' &&
      config.geminiApiKey !== 'your_gemini_api_key_here';

    if (!isApiKeyConfigured || isGeminiInCooldown()) {
      if (isGeminiInCooldown()) {
        console.log(`[aiService] Gemini call skipped due to active quota cooldown (${Math.ceil((geminiCooldownUntil - Date.now()) / 1000)}s remaining)`);
      }
      return {
        text: handleTechnicalFallback(userMessage, history, intentObj),
        action: null,
        intent: intentObj.intent,
        isFallback: true,
        provider: 'local-fallback',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = buildPromptWithSelectedContext(userMessage, selected.tasks, selected.goals, history, intentObj);
      const systemInstruction = buildSystemInstruction(intentObj);

      console.log(`[aiService] Requesting Gemini API (${config.geminiModel || 'gemini-3.6-flash'}) for intent: ${intentObj.intent}`);

      const response = await ai.models.generateContent({
        model: config.geminiModel || 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const rawText = response.text;

      if (rawText && rawText.trim() !== '') {
        const parsed = parseActionFromResponse(rawText);
        return {
          text: parsed.text,
          action: parsed.action,
          intent: intentObj.intent,
          isFallback: false,
          provider: 'gemini',
        };
      }

      throw new Error('Empty Gemini response');
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('Quota exceeded')) {
        setGeminiCooldown(60000);
      } else {
        console.warn('[aiService] Gemini call failed:', error.message);
      }
      return {
        text: handleTechnicalFallback(userMessage, history, intentObj),
        action: null,
        intent: intentObj.intent,
        isFallback: true,
        provider: 'local-fallback',
      };
    }
  },

  async suggestSubtasks(userId, goalTitle, goalDescription = '') {
    return [
      { title: `Define requirements for ${goalTitle}`, priority: 'High', dueDate: 'Tomorrow' },
      { title: `Execute core implementation steps`, priority: 'Medium', dueDate: 'In 3 Days' },
      { title: `Review and test final deliverables`, priority: 'Medium', dueDate: 'In 1 Week' },
    ];
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
      recommendation:
        completionRate > 50
          ? 'Great pace! You are consistently completing high-priority items.'
          : 'Focus on completing your top pending items before taking on new goals.',
    };
  },
};
