import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';

import { GoalProvider } from './context/GoalContext';
import { TaskProvider } from './context/TaskContext';

export default function App() {
  return (
    <BrowserRouter>
      <TaskProvider>
        <GoalProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="goals" element={<Goals />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </GoalProvider>
      </TaskProvider>
    </BrowserRouter>
  );
}