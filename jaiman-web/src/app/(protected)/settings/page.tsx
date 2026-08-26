'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Volume2, Shield, Check, AlertCircle, Save, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        setName(res.data.name || '');
        if (res.data.preferences) {
          setDailyReminders(res.data.preferences.notifications?.dailyReminders ?? true);
          setSoundEnabled(res.data.preferences.soundEnabled ?? true);
        }
      }
    } catch (err) {
      if (user) {
        setName(user.name || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', {
        name: name.trim(),
        preferences: {
          soundEnabled,
          notifications: {
            dailyReminders,
          },
        },
      });
      await refreshUser();
      setToast({ type: 'success', text: 'Account settings updated successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em]">ME · PREFERENCES</p>
          <h1 className="text-[28px] font-black text-[#1A1A2E] leading-tight flex items-center gap-2.5 mt-1">
            <SettingsIcon className="text-[#E53935]" size={30} />
            Account Settings
          </h1>
          <p className="text-[#9E9E9E] text-sm font-medium mt-1">
            Manage your profile preferences, notifications, and audio settings (synced directly with your account).
          </p>
        </div>

        {toast && (
          <div className={`p-4 rounded-2xl border-2 text-xs font-black flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
              : 'bg-[#FFE4E6] border-[#FCA5A5] text-[#FF4757]'
          }`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-44 bg-white rounded-3xl border border-gray-200" />
            <div className="h-32 bg-white rounded-3xl border border-gray-200" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Profile Details */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-6 space-y-4">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2">
                <User size={16} className="text-[#E53935]" /> Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                <div>
                  <label className="text-[#555] block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#555] block mb-1">Email Address (Registered)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] bg-gray-50 text-xs font-semibold text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1">Account Role</span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF5F5] text-[#E53935] text-xs font-black border border-[#FFCDD2] inline-block">
                    {user?.role?.toUpperCase() || 'LEARNER'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1">German Level</span>
                  <span className="px-3 py-1 rounded-full bg-[#E3F2FD] text-[#1565C0] text-xs font-black border border-[#90CAF9] inline-block">
                    {user?.level || 'A1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-6 space-y-4">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2">
                <Volume2 size={16} className="text-[#1565C0]" /> Audio & Learning Preferences
              </h3>

              <div className="space-y-3 text-xs font-bold text-[#1A1A2E]">
                <label className="flex items-center justify-between p-3 rounded-xl border-2 border-[#EAEAEA] hover:border-gray-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Volume2 size={15} className="text-[#1565C0]" /> German Audio Pronunciation Voice
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#E53935]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border-2 border-[#EAEAEA] hover:border-gray-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Bell size={15} className="text-[#FF9F43]" /> Daily 5-Minute Practice Reminder
                  </span>
                  <input
                    type="checkbox"
                    checked={dailyReminders}
                    onChange={(e) => setDailyReminders(e.target.checked)}
                    className="w-4 h-4 accent-[#E53935]"
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className="duo-btn duo-btn-red px-6 py-3 text-xs font-black flex items-center gap-2"
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border-2 border-[#FFCDD2] text-[#E53935] text-xs font-black hover:bg-[#FFF5F5] transition-all flex items-center gap-1.5"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
