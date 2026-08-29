import { useState, useEffect } from 'react';
import { Save, User, Sliders, Bell, Bot, Palette, CheckCircle2, Info, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SettingsSection from '../components/SettingsSection';
import SettingsToggle from '../components/SettingsToggle';
import SettingsSelect from '../components/SettingsSelect';

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password Change Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Sync profile when authenticated user changes
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const [preferences, setPreferences] = useState({
    defaultPriority: 'Medium',
    defaultView: 'List',
    planningTime: 'Morning',
  });

  const [notifications, setNotifications] = useState({
    taskDueReminders: true,
    overdueAlerts: true,
    goalUpdates: true,
    weeklySummary: false,
  });

  const [aiPreferences, setAiPreferences] = useState({
    personalizedInsights: true,
    productivityRecommendations: true,
    smartSuggestions: true,
  });

  const [appearance, setAppearance] = useState({
    theme: 'Dark',
  });

  const [showSavedAlert, setShowSavedAlert] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!profile.fullName.trim() || !profile.email.trim()) {
      setProfileMessage({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile(profile.fullName, profile.email);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!passwords.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveChanges = () => {
    setShowSavedAlert(true);
    setTimeout(() => {
      setShowSavedAlert(false);
    }, 3000);
  };

  const userInitials = (profile.fullName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your account and personalize your FlowMind AI experience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveChanges}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Success Confirmation Alert */}
      {showSavedAlert && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Settings saved successfully! All local preferences have been updated.</span>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Information */}
          <SettingsSection
            icon={User}
            title="Profile Information"
            description="Manage your user name and email details."
          >
            <div className="flex items-center gap-4 pb-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                {userInitials}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{profile.fullName || 'User Profile'}</h3>
                <p className="text-xs text-slate-400">{profile.email || 'No email set'}</p>
              </div>
            </div>

            {profileMessage.text && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  profileMessage.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {profileMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer mt-1"
              >
                {isUpdatingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </SettingsSection>

          {/* Account Security & Password Change */}
          <SettingsSection
            icon={Lock}
            title="Account Security"
            description="Update your password to keep your account secure."
          >
            {passwordMessage.text && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  passwordMessage.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {passwordMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold transition-colors cursor-pointer mt-1"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </SettingsSection>

          {/* Productivity Preferences */}
          <SettingsSection
            icon={Sliders}
            title="Productivity Preferences"
            description="Customize default task behaviors and planning schedules."
          >
            <SettingsSelect
              label="Default Task Priority"
              description="Initial priority assigned when creating new tasks."
              value={preferences.defaultPriority}
              options={[
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Low', value: 'Low' },
              ]}
              onChange={(val) => setPreferences({ ...preferences, defaultPriority: val })}
            />

            <SettingsSelect
              label="Default Task View"
              description="Preferred task layout format."
              value={preferences.defaultView}
              options={[
                { label: 'List View', value: 'List' },
                { label: 'Board View', value: 'Board' },
              ]}
              onChange={(val) => setPreferences({ ...preferences, defaultView: val })}
            />

            <SettingsSelect
              label="Daily Planning Time"
              description="Preferred time block for reviewing daily priorities."
              value={preferences.planningTime}
              options={[
                { label: 'Morning (8:00 AM)', value: 'Morning' },
                { label: 'Afternoon (1:00 PM)', value: 'Afternoon' },
                { label: 'Evening (6:00 PM)', value: 'Evening' },
              ]}
              onChange={(val) => setPreferences({ ...preferences, planningTime: val })}
            />
          </SettingsSection>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Choose which alerts and summary notifications you receive."
          >
            <SettingsToggle
              label="Task Due Reminders"
              description="Receive alerts for upcoming task deadlines."
              enabled={notifications.taskDueReminders}
              onChange={(val) => setNotifications({ ...notifications, taskDueReminders: val })}
            />

            <SettingsToggle
              label="Overdue Task Alerts"
              description="Get urgent notifications for overdue tasks."
              enabled={notifications.overdueAlerts}
              onChange={(val) => setNotifications({ ...notifications, overdueAlerts: val })}
            />

            <SettingsToggle
              label="Goal Progress Updates"
              description="Track milestone achievements across active goals."
              enabled={notifications.goalUpdates}
              onChange={(val) => setNotifications({ ...notifications, goalUpdates: val })}
            />

            <SettingsToggle
              label="Weekly Productivity Summary"
              description="Receive weekly email digest of completed tasks."
              enabled={notifications.weeklySummary}
              onChange={(val) => setNotifications({ ...notifications, weeklySummary: val })}
            />
          </SettingsSection>

          {/* AI Assistant Preferences */}
          <SettingsSection
            icon={Bot}
            title="AI Assistant Preferences"
            description="Configure automated assistant behavior and recommendations."
          >
            <SettingsToggle
              label="Personalized AI Insights"
              description="Enable tailored productivity insights on your dashboard."
              enabled={aiPreferences.personalizedInsights}
              onChange={(val) => setAiPreferences({ ...aiPreferences, personalizedInsights: val })}
            />

            <SettingsToggle
              label="Productivity Recommendations"
              description="Allow AI to suggest optimal focus blocks."
              enabled={aiPreferences.productivityRecommendations}
              onChange={(val) => setAiPreferences({ ...aiPreferences, productivityRecommendations: val })}
            />

            <SettingsToggle
              label="Smart Task Suggestions"
              description="Receive automated suggestions for breaking down goals."
              enabled={aiPreferences.smartSuggestions}
              onChange={(val) => setAiPreferences({ ...aiPreferences, smartSuggestions: val })}
            />

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Note: Connected to live Google Gemini AI engine. All AI prompts are securely scoped to your workspace context.
              </span>
            </div>
          </SettingsSection>

          {/* Appearance Settings */}
          <SettingsSection
            icon={Palette}
            title="Appearance"
            description="Customize the visual theme of the application."
          >
            <SettingsSelect
              label="Theme Preference"
              description="Select your preferred application color theme."
              value={appearance.theme}
              options={[
                { label: 'Dark Mode (Default)', value: 'Dark' },
                { label: 'System Preference', value: 'System' },
              ]}
              onChange={(val) => setAppearance({ ...appearance, theme: val })}
            />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
