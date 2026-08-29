import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  ListFilter,
  Target,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { aiApi } from '../services/aiApi';
import { taskApi } from '../services/taskApi';
import ChatMessage from '../components/ChatMessage';
import AIQuickAction from '../components/AIQuickAction';
import AITypingIndicator from '../components/AITypingIndicator';

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
  'Give me a 7-day MySQL study plan',
  'Explain INNER JOIN with an example',
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [aiEngineLabel, setAiEngineLabel] = useState('Gemini AI Engine');

  // UI Layout Controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Edit / Delete Modal State
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [deletingConvId, setDeletingConvId] = useState(null);

  const chatBottomRef = useRef(null);

  // Load Conversations List on Mount
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const list = await aiApi.getConversations();
      setConversations(list || []);

      if (list && list.length > 0) {
        const targetId = list[0].id || list[0]._id;
        setActiveConvId(targetId);
      } else {
        const newConv = await aiApi.createConversation('New Conversation');
        setConversations([newConv]);
        setActiveConvId(newConv.id || newConv._id);
      }
    } catch (err) {
      console.error('[AIAssistant] Failed to load conversations:', err.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load Active Conversation Messages whenever activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const loadActiveConv = async () => {
      try {
        const conv = await aiApi.getConversation(activeConvId);
        if (conv && conv.messages) {
          const formatted = conv.messages.map((m, idx) => ({
            id: m._id || m.id || idx,
            sender: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content,
            action: m.action || null,
            actionConfirmed: m.actionConfirmed || false,
            timestamp: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }));

          if (formatted.length === 0) {
            setMessages([
              {
                id: 'welcome',
                sender: 'ai',
                text: `Hi ${user?.name || 'there'}! 👋 I'm FlowMind AI. How can I help you with tasks, goals, or technical learning today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            setMessages(formatted);
          }
        }
      } catch (err) {
        console.error('[AIAssistant] Failed to load active conversation:', err.message);
      }
    };

    loadActiveConv();
  }, [activeConvId, user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCreateNewConversation = async () => {
    try {
      const newConv = await aiApi.createConversation('New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id || newConv._id);
    } catch (err) {
      console.error('[AIAssistant] Failed to create new conversation:', err.message);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const cleanText = (textToSend || inputValue).trim();
    if (!cleanText || isTyping) return;

    let targetConvId = activeConvId;

    if (!targetConvId) {
      try {
        const newConv = await aiApi.createConversation('New Conversation');
        setConversations((prev) => [newConv, ...prev]);
        targetConvId = newConv.id || newConv._id;
        setActiveConvId(targetConvId);
      } catch (err) {
        console.error('[AIAssistant] Failed to auto-create conversation:', err.message);
        return;
      }
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: cleanText,
      timestamp: timeString,
    };

    setMessages((prev) => (prev.length === 1 && prev[0].id === 'welcome' ? [userMsg] : [...prev, userMsg]));
    setInputValue('');
    setIsToolsOpen(false);
    setIsTyping(true);

    try {
      const res = await aiApi.sendConversationMessage(targetConvId, cleanText);

      if (res.provider === 'gemini' || !res.isFallback) {
        setAiEngineLabel('Gemini AI Engine');
      } else {
        setAiEngineLabel('Local Context AI Engine');
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.text,
        action: res.action || null,
        actionConfirmed: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      const updatedList = await aiApi.getConversations();
      setConversations(updatedList || []);
    } catch (err) {
      console.error('[AIAssistant Error]:', err.message);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Sorry, I encountered an issue: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const { createTask, updateTask, deleteTask, fetchTasks } = useTasks();
  const [isActionPending, setIsActionPending] = useState(false);

  const handleConfirmAction = async (msgId, action) => {
    if (!action || !action.data || isActionPending) return;

    setIsActionPending(true);
    try {
      if (action.type === 'CREATE_TASK') {
        const created = await createTask(action.data);

        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );

        const confirmMsg = {
          id: Date.now(),
          sender: 'ai',
          text: `Task **"${created?.title || action.data.title}"** created successfully! I have updated your workspace context.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      } else if (action.type === 'UPDATE_TASK') {
        await updateTask(action.data.id, action.data.updates);

        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );

        const confirmMsg = {
          id: Date.now(),
          sender: 'ai',
          text: `Task **"${action.data.title}"** updated successfully! I have updated your workspace context.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      } else if (action.type === 'DELETE_TASK') {
        await deleteTask(action.data.id);

        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );

        const confirmMsg = {
          id: Date.now(),
          sender: 'ai',
          text: `Task **"${action.data.title}"** deleted successfully! I have updated your workspace context.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    } catch (err) {
      console.error('[AIAssistant] Action failed:', err.message);
      alert(`Failed to perform action: ${err.message}`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelAction = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, action: null } : m))
    );
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRename = (conv) => {
    setEditingConvId(conv.id || conv._id);
    setEditTitleInput(conv.title);
  };

  const handleSaveRename = async (convId) => {
    if (!editTitleInput.trim()) return;
    try {
      const updated = await aiApi.renameConversation(convId, editTitleInput.trim());
      setConversations((prev) =>
        prev.map((c) => ((c.id || c._id) === convId ? { ...c, title: updated.title } : c))
      );
    } catch (err) {
      console.error('[AIAssistant] Rename failed:', err.message);
    } finally {
      setEditingConvId(null);
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await aiApi.deleteConversation(convId);
      const remaining = conversations.filter((c) => (c.id || c._id) !== convId);
      setConversations(remaining);

      if (activeConvId === convId) {
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id || remaining[0]._id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('[AIAssistant] Delete failed:', err.message);
    } finally {
      setDeletingConvId(null);
    }
  };

  const handleClearMessages = async () => {
    if (!activeConvId) return;
    try {
      await aiApi.clearConversation(activeConvId);
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Conversation cleared. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[AIAssistant] Clear failed:', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 h-[calc(100vh-6.5rem)] overflow-hidden">
      {/* Delete Confirmation Modal */}
      {deletingConvId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-semibold text-slate-100">Delete Conversation?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this conversation? All associated messages will be permanently removed from MongoDB.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingConvId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConversation(deletingConvId)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Primary Chat Container Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
        {/* Left Column: Conversations Sidebar (Expanded: w-64 lg:w-72, Collapsed: w-14) */}
        <div
          className={`bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-0 overflow-hidden shadow-sm transition-all duration-300 shrink-0 ${
            isSidebarOpen ? 'w-64 lg:w-72 p-4' : 'w-14 py-4 px-2 items-center'
          }`}
        >
          {isSidebarOpen ? (
            /* Expanded Sidebar Content */
            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Conversations
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCreateNewConversation}
                    title="New Conversation"
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    title="Hide conversations"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                {loadingConvs ? (
                  <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No conversations yet.</div>
                ) : (
                  conversations.map((conv) => {
                    const convId = conv.id || conv._id;
                    const isActive = activeConvId === convId;
                    const isEditing = editingConvId === convId;

                    return (
                      <div
                        key={convId}
                        className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                          isActive
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100 font-semibold'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={editTitleInput}
                              onChange={(e) => setEditTitleInput(e.target.value)}
                              className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(convId)}
                              className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingConvId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveConvId(convId)}
                              className="flex-1 text-left truncate mr-2 cursor-pointer"
                            >
                              <div className="truncate">{conv.title}</div>
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartRename(conv)}
                                title="Rename"
                                className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingConvId(convId)}
                                title="Delete"
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Sidebar Rail (56px Icon Column) */
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Show conversations"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCreateNewConversation}
                title="New Conversation"
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Primary Chat Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden relative">
          {/* Header Section */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  title="Show conversations"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}

              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>AI Assistant</span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Context-aware productivity & technical learning assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick Actions / Tools Popover Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isToolsOpen
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Tools</span>
                </button>

                {/* Tools Popover Menu */}
                {isToolsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl z-40 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                          Quick Actions
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsToolsOpen(false)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
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

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          Suggested Prompts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleSendMessage(prompt)}
                            className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800 text-xs text-slate-300 hover:text-indigo-300 transition-all text-left cursor-pointer truncate max-w-full"
                          >
                            "{prompt}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {activeConvId && (
                <button
                  type="button"
                  onClick={handleClearMessages}
                  title="Clear active conversation messages"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{aiEngineLabel}</span>
              </div>
            </div>
          </div>

          {/* Primary Chat Messages Scroll Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onConfirmAction={handleConfirmAction}
                onCancelAction={handleCancelAction}
                isActionPending={isActionPending}
              />
            ))}
            {isTyping && <AITypingIndicator />}
            <div ref={chatBottomRef} />
          </div>

          {/* Fixed Input Form at Bottom */}
          <form onSubmit={handleSubmitForm} className="p-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
            <div className="relative flex items-center max-w-5xl mx-auto w-full">
              <input
                type="text"
                placeholder="Ask FlowMind AI anything about tasks, goals, or technical concepts..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 transition-colors shadow-inner"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1 max-w-5xl mx-auto w-full">
              <span>Press <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Enter</kbd> to send</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                Gemini AI Engine Active
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
