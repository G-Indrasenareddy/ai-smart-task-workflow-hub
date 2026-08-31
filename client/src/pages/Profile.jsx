import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, IdCard } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Member';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner & Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Circle */}
          <div className="w-24 h-24 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-3xl shrink-0 shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>

          {/* User Name & Role */}
          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {user?.name || 'User Profile'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold self-center sm:self-auto">
                <Shield className="w-3 h-3" />
                {user?.role || 'Authenticated User'}
              </span>
            </div>
            <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" />
              {user?.email || 'No email provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Account Details Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-100 tracking-tight border-b border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Account Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Full Name Field */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {user?.name || 'N/A'}
            </div>
          </div>

          {/* Email Address Field */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {user?.email || 'N/A'}
            </div>
          </div>

          {/* Account ID Field */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Account ID</span>
            </div>
            <div className="text-sm font-mono font-semibold text-slate-300 truncate">
              {user?.id || user?._id || 'N/A'}
            </div>
          </div>

          {/* Member Since / Date Field */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Member Since</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
