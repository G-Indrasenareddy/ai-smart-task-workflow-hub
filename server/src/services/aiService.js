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

function buildSystemInstruction() {
  const todayStr = getLocalDateString(new Date());

  return `You are FlowMind AI, a helpful productivity and technical learning assistant.
Today's local date is ${todayStr}.

YOUR TWO MAJOR RESPONSIBILITIES:

1. PRODUCTIVITY ASSISTANT:
- Help users organize, prioritize, and manage their tasks and long-term goals.
- Recommend focus items based on task priority ("High", "Medium", "Low"), due dates, and goal associations.
- Generate daily focus plans, summarize workspace progress, and identify overdue or urgent items.

2. TECHNICAL LEARNING ASSISTANT:
- Provide clear, accurate, and structured explanations for technical learning questions.
- Covered topics include: Java, Python, JavaScript, SQL, MySQL, MongoDB, HTML, CSS, React, Node.js, Express, REST APIs, Git, testing, SDET concepts, interview preparation, data structures, and programming concepts.
- Provide code examples, step-by-step interview roadmaps, study plans, and quizzes when asked.
- Do NOT restrict technical questions to predefined workspace intents.

IMPORTANT RULES:
- Be natural, conversational, structured, and helpful.
- Use Markdown formatting (headings, bold text, bullet points, SQL/code blocks).
- Refer to workspace tasks and goals when relevant to the user's question, but do NOT force workspace summaries when answering general technical questions.
- Never invent tasks, goals, or database actions. Never expose API keys or credentials.`;
}

function buildPromptWithContext(userMessage, tasks, goals, history = []) {
  const todayStr = getLocalDateString(new Date());

  // 1. Format Tasks Context
  const taskDetails = tasks.map((t) => {
    let dueInfo = t.dueDate || 'No due date';
    if (t.dueDate) {
      const lower = t.dueDate.trim().toLowerCase();
      if (lower === 'today' || t.dueDate.trim() === todayStr) {
        dueInfo = `DUE TODAY (${todayStr})`;
      }
    }
    const descInfo = t.description ? ` - ${t.description}` : '';
    const goalRef = t.goal ? ` [Linked Goal ID: ${t.goal}]` : '';
    return `- "${t.title}" [Priority: ${t.priority}, Status: ${t.status}, Due: ${dueInfo}]${descInfo}${goalRef}`;
  });

  const taskSummary =
    taskDetails.length === 0
      ? 'No tasks currently in workspace.'
      : `User's Current Tasks (${tasks.length} total):\n${taskDetails.join('\n')}`;

  // 2. Format Goals Context
  const goalDetails = goals.map(
    (g) => `- "${g.title}" [Progress: ${g.progress}%, Status: ${g.status}${g.targetDate ? `, Target: ${g.targetDate}` : ''}]`
  );

  const goalSummary =
    goalDetails.length === 0
      ? 'No active goals currently in workspace.'
      : `User's Current Goals (${goals.length} total):\n${goalDetails.join('\n')}`;

  // 3. Format Conversation History (last 30 messages)
  const pastMessages = history
    .slice(-30)
    .map((m) => {
      const roleName = m.role === 'assistant' || m.sender === 'ai' ? 'Assistant' : 'User';
      const text = m.content || m.text || '';
      return `${roleName}: ${text}`;
    })
    .join('\n');

  const historySummary =
    pastMessages.trim() === '' ? 'No prior conversation history.' : `Conversation History:\n${pastMessages}`;

  return `LIVE WORKSPACE CONTEXT (Today is ${todayStr}):
${taskSummary}

${goalSummary}

${historySummary}

User's Latest Message: "${userMessage}"`;
}

function handleIntentAwareFallback(userMessage, tasks, goals, history = []) {
  let cleanInput = userMessage.trim();
  let leadingGreetingPrefix = '';

  const greetingMatch = cleanInput.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)[,\s!.]+/i);
  if (greetingMatch && cleanInput.length > greetingMatch[0].length) {
    leadingGreetingPrefix = `Hi! 👋 `;
    cleanInput = cleanInput.substring(greetingMatch[0].length).trim();
  }

  const lower = cleanInput.toLowerCase();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const highPriorityPending = pendingTasks.filter((t) => t.priority === 'High');
  const todayStr = getLocalDateString(new Date());

  const dueTodayTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const l = t.dueDate.trim().toLowerCase();
    return l === 'today' || t.dueDate.trim() === todayStr;
  });

  const revHistory = history.slice().reverse();
  const assistantMessages = revHistory.filter((m) => (m.role === 'assistant' || m.sender === 'ai') && m.content !== 'welcome');
  const combinedAssistantText = assistantMessages.map((m) => m.content || m.text || '').join(' ');

  const lastTaskMentioned = pendingTasks.find((t) => combinedAssistantText.includes(t.title)) || pendingTasks[0];

  // Follow-up Reasoning
  if (
    lower === 'why' ||
    lower === 'why?' ||
    lower === 'explain that' ||
    lower === 'explain' ||
    lower === 'what do you mean?' ||
    lower.includes('what makes it important')
  ) {
    if (lastTaskMentioned) {
      const otherTasks = pendingTasks.filter((t) => (t.id || t._id) !== (lastTaskMentioned.id || lastTaskMentioned._id));
      const otherInfo =
        otherTasks.length > 0
          ? `Your other task ("${otherTasks[0].title}") is due ${otherTasks[0].dueDate || 'later'}, so "${lastTaskMentioned.title}" has a more immediate priority deadline.`
          : `It is currently your top pending item.`;
      return `${leadingGreetingPrefix}I recommended "${lastTaskMentioned.title}" because it is marked **${lastTaskMentioned.priority} priority** and due **${lastTaskMentioned.dueDate || 'today'}**. ${otherInfo} Completing it first removes today's most urgent bottleneck.`;
    }
    return `${leadingGreetingPrefix}This recommendation is based on task priority rankings and upcoming due dates in your workspace.`;
  }

  // Follow-up Next Step
  if (
    lower.includes('after that') ||
    lower.includes('after completing') ||
    lower.includes('what should i do next') ||
    lower.includes('and then') ||
    lower.includes('what after')
  ) {
    const remainingTasks = pendingTasks.filter((t) => !combinedAssistantText.includes(t.title));
    if (remainingTasks.length > 0) {
      const nextTask = remainingTasks.find((t) => t.priority === 'High') || remainingTasks[0];
      return `${leadingGreetingPrefix}After completing "${lastTaskMentioned ? lastTaskMentioned.title : 'your first task'}", move to **"${nextTask.title}"** (${nextTask.priority} priority, Due: ${nextTask.dueDate || 'Soon'}). Following this sequence ensures high-priority items with nearest deadlines are completed in order.`;
    }
    return `${leadingGreetingPrefix}After completing "${lastTaskMentioned ? lastTaskMentioned.title : 'your task'}", you will have finished all pending workspace items! Consider reviewing your active goals or defining new action items.`;
  }

  // Technical Learning & Interview Roadmaps
  if (
    lower.includes('roadmap') ||
    lower.includes('interview preparation') ||
    lower.includes('mysql interview') ||
    lower.includes('study first for mysql')
  ) {
    return `${leadingGreetingPrefix}### 🚀 MySQL Interview & Learning Roadmap

Here is a structured, step-by-step roadmap to master MySQL for interviews:

#### 1. SQL Basics & Queries
- \`SELECT\`, \`WHERE\`, \`ORDER BY\`, \`LIMIT\`, \`DISTINCT\`
- Handling NULL values with \`IS NULL\` and \`COALESCE\`

#### 2. Aggregation & Grouping
- Aggregate functions: \`COUNT()\`, \`SUM()\`, \`AVG()\`, \`MIN()\`, \`MAX()\`
- Grouping rows: \`GROUP BY\` vs \`HAVING\` clauses

#### 3. Table Joins
- \`INNER JOIN\`, \`LEFT JOIN\`, \`RIGHT JOIN\`, \`FULL OUTER JOIN\`, \`CROSS JOIN\`

#### 4. Advanced SQL & Window Functions
- Conditional logic with \`CASE WHEN\`
- Window functions: \`ROW_NUMBER()\`, \`RANK()\`, \`DENSE_RANK()\`

#### 5. Database Concepts & Optimization
- Indexes (B-Tree, Clustered vs Non-Clustered) & Query Execution Plans
- Normalization (1NF, 2NF, 3NF) & ACID Transactions

*Tip: Work through these topics step-by-step to master MySQL!*`;
  }

  // Technical Explanations
  if (
    lower.includes('inner join') ||
    lower.includes('normalization') ||
    lower.includes('indexes') ||
    lower.includes('primary key')
  ) {
    if (lower.includes('inner join')) {
      return `${leadingGreetingPrefix}### 💡 INNER JOIN Explanation & Example

An **INNER JOIN** returns only the rows where there is a matching value in **both** tables.

#### SQL Example:
\`\`\`sql
SELECT Employees.name, Departments.dept_name
FROM Employees
INNER JOIN Departments ON Employees.dept_id = Departments.dept_id;
\`\`\`

Only employees with matching department IDs are included in the result.`;
    }
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)$/i.test(lower)) {
    return `Hi! 👋 I'm FlowMind AI. I can help you prioritize tasks, track goals, plan your schedule, or answer technical learning questions. What would you like to work on today?`;
  }

  // Task Priority
  if (lower.includes('priority') || lower.includes('prioritize') || lower.includes('work on first') || lower.includes('first')) {
    if (dueTodayTasks.length > 0) {
      const topTask = dueTodayTasks.find((t) => t.priority === 'High') || dueTodayTasks[0];
      return `${leadingGreetingPrefix}Start with **"${topTask.title}"** because it is **${topTask.priority} priority** and **due today** (${todayStr}). Once that is completed, move to your remaining pending items to build momentum.`;
    }
    if (highPriorityPending.length > 0) {
      const topTask = highPriorityPending[0];
      const dueInfo = topTask.dueDate ? `, due ${topTask.dueDate}` : '';
      return `${leadingGreetingPrefix}Start with **"${topTask.title}"** because it is **High priority** (Status: ${topTask.status}${dueInfo}). Tackling high-priority items first delivers the highest impact.`;
    }
    if (pendingTasks.length > 0) {
      const topTask = pendingTasks[0];
      return `${leadingGreetingPrefix}Your top recommended next action is **"${topTask.title}"** (Status: ${topTask.status}). Completing pending items will build momentum.`;
    }
    return `${leadingGreetingPrefix}You have completed all pending tasks! Consider setting a new goal or adding new action items to stay on track.`;
  }

  // Task Summary
  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('my tasks')) {
    if (totalTasks === 0) {
      return `${leadingGreetingPrefix}You currently have **0 tasks** in your workspace. You can add new tasks anytime from the Tasks dashboard!`;
    }
    const breakdown = tasks
      .map((t) => `- **"${t.title}"** [Priority: ${t.priority}, Status: ${t.status}, Due: ${t.dueDate || 'N/A'}]`)
      .join('\n');
    return `${leadingGreetingPrefix}Here is a summary of your workspace tasks (**${completedTasks.length}/${totalTasks} completed**):\n${breakdown}`;
  }

  // Daily Plan
  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('plan for today')) {
    if (pendingTasks.length === 0) {
      return `${leadingGreetingPrefix}Your daily schedule is completely open because all tasks are completed! Use today to review long-term goals or plan upcoming projects.`;
    }
    const t1 = pendingTasks[0];
    const t2 = pendingTasks[1] || pendingTasks[0];

    return `${leadingGreetingPrefix}### 📅 Recommended Daily Focus Plan

- **Morning Focus (8:00 AM - 11:30 AM)**: Work on **"${t1.title}"** (${t1.priority} priority, Due: ${t1.dueDate || 'Today'}).
- **Afternoon Block (1:00 PM - 3:30 PM)**: Tackle **"${t2.title}"** (${t2.priority} priority).
- **Evening Review (4:30 PM - 5:00 PM)**: Review active goals and update completion status on your Dashboard.`;
  }

  return `${leadingGreetingPrefix}I reviewed your workspace context (${totalTasks} task(s), ${goals.length} goal(s)). Ask me to prioritize tasks, explain technical concepts, generate learning roadmaps, or outline a daily plan!`;
}

export const aiService = {
  async generateChatResponse(userId, userMessage, history = []) {
    // 1. Fetch authenticated user's tasks & goals scoped to userId
    const tasks = await taskService.getAllTasks(userId);
    const goals = await goalService.getAllGoals(userId);

    const isApiKeyConfigured =
      config.geminiApiKey &&
      config.geminiApiKey.trim() !== '' &&
      config.geminiApiKey !== 'your_gemini_api_key_here';

    if (!isApiKeyConfigured) {
      return {
        text: handleIntentAwareFallback(userMessage, tasks, goals, history),
        isFallback: true,
        provider: 'local-fallback',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = buildPromptWithContext(userMessage, tasks, goals, history);
      const systemInstruction = buildSystemInstruction();

      const response = await ai.models.generateContent({
        model: config.geminiModel || 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const responseText = response.text;

      if (responseText && responseText.trim() !== '') {
        return {
          text: responseText.trim(),
          isFallback: false,
          provider: 'gemini',
        };
      }

      throw new Error('Empty response received from Gemini API');
    } catch (error) {
      console.warn('[aiService] Gemini API request failed, invoking local fallback:', error.message);
      return {
        text: handleIntentAwareFallback(userMessage, tasks, goals, history),
        isFallback: true,
        provider: 'local-fallback',
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
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = `Goal Title: "${goalTitle}"\nGoal Description: "${goalDescription}"\nGenerate 3 key sub-tasks to complete this goal. Output ONLY a valid JSON array of objects with keys: title, priority ("High", "Medium", or "Low"), dueDate ("Today", "Tomorrow", "In 3 Days").`;

      const result = await ai.models.generateContent({
        model: config.geminiModel || 'gemini-3.6-flash',
        contents: prompt,
      });

      const text = result.text;
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
      recommendation:
        completionRate > 50
          ? 'Great pace! You are consistently completing high-priority items.'
          : 'Focus on completing your top pending "To Do" items before taking on new goals.',
    };
  },
};
