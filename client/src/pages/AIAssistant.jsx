import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ListFilter, Target, TrendingUp, Lightbulb, MessageSquare } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import AIQuickAction from '../components/AIQuickAction';
import AITypingIndicator from '../components/AITypingIndicator';

const initialMessages = [
  {
    id: 1,
    sender: 'ai',
    text: "Hi Indrasena! I'm your FlowMind AI assistant. I can help you prioritize tasks, track progress, and improve your productivity. What would you like to work on today?",
    timestamp: '10:00 AM',
  },
  {
    id: 2,
    sender: 'user',
    text: 'Help me prioritize my tasks for today.',
    timestamp: '10:01 AM',
  },
  {
    id: 3,
    sender: 'ai',
    text: "Based on your current tasks, I recommend starting with 'Finalize Q3 Product Roadmap' because it is high priority and due at 2:00 PM. Then focus on 'Prepare Sprint Demo Slides' and 'Review Frontend Component Architecture'.",
    timestamp: '10:01 AM',
  },
];

const quickActions = [
  {
    id: 'summarize',
    title: 'Summarize My Tasks',
    description: 'Get a concise overview of your current tasks.',
    icon: ListFilter,
    prompt: 'Summarize my current tasks.',
  },
  {
    id: 'prioritize',
    title: 'Prioritize My Day',
    description: 'Identify the most important tasks to focus on.',
    icon: Target,
    prompt: 'Help me prioritize my tasks for today.',
  },
  {
    id: 'suggest',
    title: 'Suggest Next Steps',
    description: 'Get recommendations based on your current progress.',
    icon: Sparkles,
    prompt: 'Suggest next steps for my active projects.',
  },
  {
    id: 'analyze',
    title: 'Analyze My Productivity',
    description: 'Review your productivity patterns and insights.',
    icon: TrendingUp,
    prompt: 'Analyze my productivity performance.',
  },
];

const suggestedPrompts = [
  'What should I work on first?',
  'Summarize my current progress',
  'Which goals are at risk?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateMockResponse = (userText) => {
    const textLower = userText.toLowerCase();

    if (textLower.includes('priority') || textLower.includes('prioritize') || textLower.includes('first')) {
      return "Your top priority today should be 'Finalize Q3 Product Roadmap' (High Priority, due 2:00 PM). Follow up with 'Prepare Sprint Demo Slides' to keep your team aligned.";
    }
    if (textLower.includes('summarize') || textLower.includes('summary') || textLower.includes('progress')) {
      return "Summary Overview: You have 8 total tasks (3 To Do, 3 In Progress, 2 Completed). Your overall goal completion rate is at 60%, with 1 goal ('Q3 User Acquisition Campaign') currently marked At Risk.";
    }
    if (textLower.includes('goal') || textLower.includes('risk')) {
      return "Goal Status Alert: 'Q3 User Acquisition Campaign' is currently at 40% progress and marked 'At Risk' (Target: Sept 30). I recommend allocating 2 hours tomorrow for task execution.";
    }
    if (textLower.includes('productivity') || textLower.includes('analyze') || textLower.includes('insight')) {
      return "Productivity Insight: You complete 35% more high-priority tasks during morning hours before 12:00 PM. Maintaining deep work blocks in the morning will maximize output.";
    }
    if (textLower.includes('help') || textLower.includes('suggest')) {
      return "I can assist you with task breakdown, daily prioritization, sprint planning, and goal tracking. Try clicking any of the Quick Actions on the left!";
    }

    return "I've logged your request! Full AI model integration (OpenAI / Gemini API) will be connected in an upcoming phase. Currently running on local simulated responses.";
  };

  const handleSendMessage = (textToSend) => {
    const cleanText = (textToSend || inputValue).trim();
    if (!cleanText || isTyping) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Append User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: cleanText,
      timestamp: timeString,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // 2. Simulate AI Processing Delay (800ms)
    setTimeout(() => {
      const aiResponseText = generateMockResponse(cleanText);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 h-[calc(100vh-6.5rem)] overflow-hidden">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI Assistant</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Get personalized productivity insights and task recommendations.
          </p>
        </div>

        {/* AI Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Assistant Ready</span>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Quick Actions & Suggested Prompts */}
        <div className="space-y-4 flex flex-col min-h-0 overflow-y-auto pr-1">
          {/* Quick Actions Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <AIQuickAction
                  key={action.id}
                  icon={action.icon}
                  title={action.title}
                  description={action.description}
                  onClick={() => handleSendMessage(action.prompt)}
                />
              ))}
            </div>
          </div>

          {/* Suggested Prompts Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Suggested Prompts
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-indigo-300 transition-all text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Main Chat Window (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          {/* Chat Messages Container - Internal Scroll Only */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 min-h-0">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <AITypingIndicator />}
            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Chat Input Bar - Anchored to bottom */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask FlowMind AI anything about your tasks or goals..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 transition-colors"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>Press <kbd className="font-mono bg-slate-800 px-1 rounded text-slate-400">Enter</kbd> to send</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-slate-600" />
                Simulated AI Session
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
