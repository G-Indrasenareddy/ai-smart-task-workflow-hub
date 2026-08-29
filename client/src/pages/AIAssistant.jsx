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
  ArrowDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';
import { aiApi } from '../services/aiApi';
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
  'Quiz me on SQL',
];

function sanitizeError(msg) {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'The AI engine is currently operating under high request volume. Local workspace fallback mode is active.';
  }
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token')) {
    return 'Your session has expired. Please log in again to continue.';
  }
  return msg.replace(/(?:file:\/\/\/|[A-Z]:\\[^\s]+|bearer\s+[^\s]+|mongodb[^\s]+)/gi, '[sanitized]');
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { createTask, updateTask, deleteTask } = useTasks();
  const { createGoal, updateGoal, deleteGoal } = useGoals();

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
  const [showNewMessagesBtn, setShowNewMessagesBtn] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Edit / Delete Conversation Modal State
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [deletingConvId, setDeletingConvId] = useState(null);
  const [isDeletingConv, setIsDeletingConv] = useState(false);
  const [isRenamingConv, setIsRenamingConv] = useState(false);

  const chatContainerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

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

  // Handle Scroll Position Detection
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowNewMessagesBtn(isScrolledUp);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagesBtn(false);
  };

  // Auto-scroll on new messages unless user scrolled up
  useEffect(() => {
    if (!showNewMessagesBtn) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Create New Conversation (Guarded against double-click)
  const handleCreateNewConversation = async () => {
    if (isCreatingConv) return;
    setIsCreatingConv(true);
    try {
      const newConv = await aiApi.createConversation('New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      const newId = newConv.id || newConv._id;
      setActiveConvId(newId);
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Hi ${user?.name || 'there'}! 👋 I'm FlowMind AI. How can I help you with tasks, goals, or technical learning today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInputValue('');
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('[AIAssistant] Failed to create new conversation:', err.message);
    } finally {
      setIsCreatingConv(false);
    }
  };

  // Select Conversation
  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const rawText = typeof textToSend === 'string' ? textToSend : inputValue;
    const cleanText = (rawText || '').trim();
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

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      const response = await aiApi.sendMessage(targetConvId, cleanText);

      if (response && response.provider) {
        if (response.provider === 'local-fallback' || response.isFallback) {
          setAiEngineLabel('Local Context AI');
        } else {
          setAiEngineLabel('Gemini AI Engine');
        }
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.text || "I've processed your request.",
        action: response.action || null,
        actionConfirmed: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Auto-update conversation title if it's the first message
      const currentConv = conversations.find((c) => (c.id || c._id) === targetConvId);
      if (currentConv && (currentConv.title === 'New Conversation' || currentConv.title === 'Untitled')) {
        const newTitle = cleanText.length > 28 ? cleanText.substring(0, 28) + '...' : cleanText;
        try {
          await aiApi.renameConversation(targetConvId, newTitle);
          setConversations((prev) =>
            prev.map((c) => ((c.id || c._id) === targetConvId ? { ...c, title: newTitle } : c))
          );
        } catch (e) {
          // Silent title update error
        }
      }
    } catch (err) {
      console.error('[AIAssistant] Send message failed:', err.message);
      const safeErrText = sanitizeError(err.message);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Sorry, I encountered an issue: ${safeErrText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmitForm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = (inputRef.current ? inputRef.current.value : inputValue) || '';
    if (!isTyping && val.trim()) {
      handleSendMessage(val);
    }
  };

  const handleKeyDown = (e) => {
    const isEnterKey =
      e.key === 'Enter' ||
      e.keyCode === 13 ||
      e.which === 13 ||
      e.code === 'Enter' ||
      e.code === 'NumpadEnter';

    if (isEnterKey && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      const val = (e.target ? e.target.value : inputValue) || '';
      if (!isTyping && val.trim()) {
        handleSendMessage(val);
      }
    }
  };

  // Confirm Interactive Action Card (CREATE_TASK, UPDATE_TASK, DELETE_TASK, etc.)
  const handleConfirmAction = async (msgId, action) => {
    if (!action || !action.data || isActionPending) return;

    setIsActionPending(true);
    try {
      if (action.type === 'CREATE_TASK') {
        const created = await createTask(action.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Task **"${created?.title || action.data.title}"** created successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.type === 'UPDATE_TASK') {
        await updateTask(action.data.id, action.data.updates);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Task **"${action.data.title}"** updated successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.type === 'DELETE_TASK') {
        await deleteTask(action.data.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Task **"${action.data.title}"** deleted successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.type === 'CREATE_GOAL') {
        const created = await createGoal(action.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Goal **"${created?.title || action.data.title}"** created successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.type === 'UPDATE_GOAL') {
        await updateGoal(action.data.id, action.data.updates);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Goal **"${action.data.title}"** updated successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.type === 'DELETE_GOAL') {
        await deleteGoal(action.data.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionConfirmed: true } : m))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `Goal **"${action.data.title}"** deleted successfully! Workspace context updated.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('[AIAssistant] Action failed:', err.message);
      alert(`Failed to perform action: ${sanitizeError(err.message)}`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelAction = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, action: null, text: `${m.text}\n\n*(Proposed action was cancelled)*` }
          : m
      )
    );
  };

  const handleClearMessages = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Conversation cleared. How can I help you with tasks, goals, or technical learning?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Rename Conversation
  const handleStartRename = (conv) => {
    setEditingConvId(conv.id || conv._id);
    setEditTitleInput(conv.title || '');
  };

  const handleSaveRename = async (convId) => {
    const cleanTitle = editTitleInput.trim();
    if (!cleanTitle || isRenamingConv) return;

    setIsRenamingConv(true);
    try {
      const truncatedTitle = cleanTitle.length > 100 ? cleanTitle.substring(0, 100) : cleanTitle;
      await aiApi.renameConversation(convId, truncatedTitle);
      setConversations((prev) =>
        prev.map((c) => ((c.id || c._id) === convId ? { ...c, title: truncatedTitle } : c))
      );
      setEditingConvId(null);
    } catch (err) {
      console.error('[AIAssistant] Rename failed:', err.message);
      alert(`Failed to rename conversation: ${sanitizeError(err.message)}`);
    } finally {
      setIsRenamingConv(false);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!deletingConvId || isDeletingConv) return;

    setIsDeletingConv(true);
    try {
      await aiApi.deleteConversation(deletingConvId);
      const updatedList = conversations.filter((c) => (c.id || c._id) !== deletingConvId);
      setConversations(updatedList);

      if (activeConvId === deletingConvId) {
        if (updatedList.length > 0) {
          setActiveConvId(updatedList[0].id || updatedList[0]._id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
      setDeletingConvId(null);
    } catch (err) {
      console.error('[AIAssistant] Delete conversation failed:', err.message);
      alert(`Failed to delete conversation: ${sanitizeError(err.message)}`);
    } finally {
      setIsDeletingConv(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden max-w-7xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Flex Layout Container */}
      <div className="flex-1 flex gap-4 min-h-0 relative overflow-hidden">
        {/* Left Conversation Sidebar */}
        <div
          className={`bg-slate-900 border border-slate-800 rounded-xl flex flex-col transition-all duration-300 shadow-sm shrink-0 z-40 ${
            isSidebarOpen
              ? 'w-72 fixed md:relative inset-y-0 left-0 h-full md:h-auto'
              : 'w-14 items-center py-3'
          }`}
        >
          {isSidebarOpen ? (
            <div className="flex flex-col h-full p-3.5 space-y-3 min-h-0">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Conversations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* New Conversation Button */}
              <button
                type="button"
                disabled={isCreatingConv}
                onClick={handleCreateNewConversation}
                aria-label="New Conversation"
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingConv ? 'Creating...' : 'New Conversation'}</span>
              </button>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
                {loadingConvs ? (
                  <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No conversations yet.
                  </div>
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
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-100 font-semibold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              maxLength={100}
                              value={editTitleInput}
                              onChange={(e) => setEditTitleInput(e.target.value)}
                              className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={isRenamingConv}
                              onClick={() => handleSaveRename(convId)}
                              aria-label="Save title"
                              className="p-1 text-emerald-400 hover:bg-slate-800 rounded cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingConvId(null)}
                              aria-label="Cancel rename"
                              className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSelectConversation(convId)}
                              className="flex-1 text-left truncate mr-2 cursor-pointer"
                            >
                              <div className="truncate">{conv.title}</div>
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartRename(conv)}
                                title="Rename conversation"
                                aria-label="Rename conversation"
                                className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingConvId(convId)}
                                title="Delete conversation"
                                aria-label="Delete conversation"
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
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
            <div className="flex flex-col items-center gap-3 w-full py-2">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Show conversations"
                aria-label="Expand sidebar"
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isCreatingConv}
                onClick={handleCreateNewConversation}
                title="New Conversation"
                aria-label="New Conversation"
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
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
                  aria-label="Expand sidebar"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}

              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>FlowMind AI Assistant</span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Context-aware task management, goals & interactive technical learning
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick Actions / Tools Popover Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  aria-label="Tools menu"
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
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl z-50 space-y-4 animate-fadeIn">
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
                        aria-label="Close tools menu"
                        className="text-slate-400 hover:text-slate-200 cursor-pointer"
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
                          onClick={() => {
                            handleSendMessage(action.prompt);
                            setIsToolsOpen(false);
                          }}
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
                            onClick={() => {
                              handleSendMessage(prompt);
                              setIsToolsOpen(false);
                            }}
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
                  aria-label="Clear active conversation"
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
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-0 relative"
          >
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

          {/* Floating "New Messages" Jump Button when User Scrolled Up */}
          {showNewMessagesBtn && (
            <div className="absolute bottom-20 right-6 z-30">
              <button
                type="button"
                onClick={scrollToBottom}
                aria-label="New Messages"
                className="px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer animate-bounce"
              >
                <ArrowDown className="w-4 h-4" />
                <span>New messages</span>
              </button>
            </div>
          )}

          {/* Message Composer Form */}
          <form onSubmit={handleSubmitForm} className="p-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-2 max-w-5xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors shadow-inner">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ask FlowMind AI anything about tasks, goals, or technical concepts..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-none overflow-y-auto max-h-32 leading-relaxed"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!inputValue.trim() || isTyping}
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1 max-w-5xl mx-auto w-full">
              <span>Press <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Enter</kbd> to send, <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Shift+Enter</kbd> for new line</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                Gemini AI Engine Active
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Conversation Confirmation Modal */}
      {deletingConvId && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDeletingConvId(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Delete Conversation?</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this conversation and all its messages? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingConvId(null)}
                disabled={isDeletingConv}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConversation}
                disabled={isDeletingConv}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeletingConv ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
