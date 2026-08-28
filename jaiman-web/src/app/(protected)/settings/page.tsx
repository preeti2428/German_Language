'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon, User, Bell, Volume2, Check, AlertCircle,
  Save, LogOut, Lock, Globe, Building2, Shield, Eye, EyeOff,
  Trash2, ChevronRight, BookOpen, Target
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🦄', '🐸', '🦋', '🐧', '🦅', '🐺', '🦉', '🐬'];
const GERMAN_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const NATIVE_LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Urdu', 'Other'];

// ── Top-level stable components to prevent input focus loss ──────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  icon: string;
  label: string;
  sublabel?: string;
}

function SettingToggle({ checked, onChange, icon, label, sublabel }: ToggleProps) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-[#EAEAEA] hover:border-gray-300 cursor-pointer transition-all bg-white">
      <span className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <span>
          <p className="text-xs font-bold text-[#1A1A2E]">{label}</p>
          {sublabel && <p className="text-[10px] text-[#BDBDBD] font-medium mt-0.5">{sublabel}</p>}
        </span>
      </span>
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`w-11 h-6 rounded-full relative transition-all cursor-pointer flex-shrink-0 ${checked ? 'bg-[#E53935]' : 'bg-[#E0E0E0]'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();

  // Profile
  const [name, setName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('Hindi');
  const [targetLevel, setTargetLevel] = useState('A2');
  const [accountType, setAccountType] = useState<'individual' | 'college' | 'university'>('individual');
  const [institutionName, setInstitutionName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [showProgressPublic, setShowProgressPublic] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [practiceReminderTime, setPracticeReminderTime] = useState('09:00');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDangerSection, setShowDangerSection] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        setName(res.data.name || '');
        setNativeLanguage(res.data.nativeLanguage || 'Hindi');
        setTargetLevel(res.data.level || 'A2');
        setAccountType(res.data.accountType || 'individual');
        setInstitutionName(res.data.institutionName || '');
        setSelectedAvatar(res.data.avatar || '🦊');
        if (res.data.preferences) {
          const s = res.data.preferences.soundEnabled ?? true;
          setSoundEnabled(s);
          if (typeof window !== 'undefined') localStorage.setItem('soundEnabled', String(s));
          setDailyReminders(res.data.preferences.notifications?.dailyReminders ?? true);
          setShowProgressPublic(res.data.preferences.showProgressPublic ?? true);
          setEmailUpdates(res.data.preferences.emailUpdates ?? false);
          setPracticeReminderTime(res.data.preferences.practiceReminderTime || '09:00');
        }
      }
    } catch {
      if (user) { setName(user.name || ''); }
    } finally { setLoading(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundEnabled', String(soundEnabled));
        if (dailyReminders && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch {}
        }
      }

      await api.put('/users/profile', {
        name: name.trim(),
        nativeLanguage,
        level: targetLevel,
        accountType,
        institutionName: accountType !== 'individual' ? institutionName.trim() : '',
        avatar: selectedAvatar,
        preferences: {
          soundEnabled,
          showProgressPublic,
          emailUpdates,
          practiceReminderTime,
          notifications: { dailyReminders },
        },
      });
      await refreshUser();
      showToast('success', '✅ Profile saved successfully!');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast('error', '❌ New passwords do not match!'); return; }
    if (newPassword.length < 6) { showToast('error', '❌ Password must be at least 6 characters'); return; }
    setChangingPassword(true);
    try {
      await api.put('/users/profile', { password: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast('success', '🔐 Password changed successfully!');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em]">ME · PREFERENCES</p>
          <h1 className="text-[26px] font-black text-[#1A1A2E] leading-tight flex items-center gap-2.5 mt-1">
            <SettingsIcon className="text-[#E53935]" size={28} />
            Account Settings
          </h1>
          <p className="text-[#9E9E9E] text-xs font-medium mt-1">
            Manage everything about your account — profile, password, language, notifications & more.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`p-4 rounded-2xl border-2 text-xs font-black flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]' : 'bg-[#FFE4E6] border-[#FCA5A5] text-[#FF4757]'
          }`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-3xl border border-gray-200" />)}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">

            {/* ── 1. PROFILE INFORMATION ─────────────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 space-y-4">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2">
                <User size={16} className="text-[#E53935]" /> Profile Information
              </h3>

              {/* Avatar Picker */}
              <div>
                <p className="text-[10px] font-black uppercase text-[#9E9E9E] mb-2">🎭 Your Avatar (Pick One)</p>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((av) => (
                    <button key={av} type="button" onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 text-xl rounded-xl border-2 flex items-center justify-center transition-all ${
                        selectedAvatar === av
                          ? 'border-[#E53935] bg-[#FFF5F5] scale-110 shadow-sm'
                          : 'border-[#EAEAEA] hover:border-[#E53935]'
                      }`}>{av}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full py-3 px-3.5 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold text-[#1A1A2E] bg-white focus:outline-none focus:border-[#E53935]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full py-3 px-3.5 rounded-xl border-2 border-[#EAEAEA] bg-[#F8F8F8] text-xs font-semibold text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap pt-1">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1">Account Role</span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF5F5] text-[#E53935] text-xs font-black border border-[#FFCDD2] inline-block">
                    {user?.role?.toUpperCase() || 'LEARNER'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1">Current Level</span>
                  <span className="px-3 py-1 rounded-full bg-[#E3F2FD] text-[#1565C0] text-xs font-black border border-[#90CAF9] inline-block">
                    {user?.level || 'A1'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 2. LANGUAGE & LEARNING GOALS ───────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 space-y-4">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2">
                <Globe size={16} className="text-[#4361EE]" /> Language & Learning Goals
              </h3>

              <div>
                <p className="text-[10px] font-black uppercase text-[#9E9E9E] mb-2">🗣️ My Native Language</p>
                <div className="flex flex-wrap gap-2">
                  {NATIVE_LANGUAGES.map((lang) => (
                    <button key={lang} type="button" onClick={() => setNativeLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                        nativeLanguage === lang
                          ? 'border-[#4361EE] bg-[#EEF2FF] text-[#4361EE]'
                          : 'border-[#EAEAEA] text-[#757575] hover:border-[#4361EE]'
                      }`}>{lang}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-[#9E9E9E] mb-2">🎯 My Target German Level</p>
                <div className="flex gap-2 flex-wrap">
                  {GERMAN_LEVELS.map((lvl) => (
                    <button key={lvl} type="button" onClick={() => setTargetLevel(lvl)}
                      className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                        targetLevel === lvl
                          ? 'border-[#E53935] bg-[#FFF5F5] text-[#E53935]'
                          : 'border-[#EAEAEA] text-[#757575] hover:border-[#E53935]'
                      }`}>{lvl}</button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl border-2 border-[#EAEAEA] bg-[#F8F9FF] text-xs font-bold text-[#4361EE] flex items-center gap-2">
                <span className="text-lg">🇩🇪</span> Learning Language: German (Deutsch)
                <span className="ml-auto text-[10px] text-[#BDBDBD] font-bold">FIXED</span>
              </div>
            </div>

            {/* ── 3. ACCOUNT TYPE & INSTITUTION ──────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 space-y-4">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2">
                <Building2 size={16} className="text-[#20BF6B]" /> Account Type & Institution
              </h3>

              <div>
                <p className="text-[10px] font-black uppercase text-[#9E9E9E] mb-2">I am learning as...</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['individual', 'college', 'university'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setAccountType(type)}
                      className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                        accountType === type
                          ? 'border-[#20BF6B] bg-[#F0FFF4] text-[#20BF6B]'
                          : 'border-[#EAEAEA] text-[#757575] hover:border-[#20BF6B]'
                      }`}>
                      {type === 'individual' ? '👤 Individual' : type === 'college' ? '🏫 College' : '🎓 University'}
                    </button>
                  ))}
                </div>
              </div>

              {accountType !== 'individual' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">
                    {accountType === 'college' ? 'College Name' : 'University Name'}
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder={accountType === 'college' ? 'e.g. Delhi University / St. Xavier’s College' : 'e.g. Technical University of Munich'}
                    className="w-full py-3 px-3.5 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold text-[#1A1A2E] bg-white focus:outline-none focus:border-[#20BF6B] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* ── 4. AUDIO & NOTIFICATIONS ───────────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 space-y-3">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2 mb-1">
                <Bell size={16} className="text-[#FF9F43]" /> Audio & Notifications
              </h3>

              <SettingToggle
                checked={soundEnabled}
                onChange={setSoundEnabled}
                icon="🔊"
                label="German Audio Pronunciation"
                sublabel="Play German word sounds during lessons and quizzes"
              />
              <SettingToggle
                checked={dailyReminders}
                onChange={setDailyReminders}
                icon="⏰"
                label="Daily 5-Minute Practice Reminder"
                sublabel="Get a reminder to keep your streak alive"
              />
              <SettingToggle
                checked={emailUpdates}
                onChange={setEmailUpdates}
                icon="📧"
                label="Email Updates & Newsletter"
                sublabel="Receive weekly tips, new courses, and announcements"
              />

              {dailyReminders && (
                <div className="pt-1">
                  <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">⏱️ Preferred Reminder Time</label>
                  <input
                    type="time"
                    value={practiceReminderTime}
                    onChange={(e) => setPracticeReminderTime(e.target.value)}
                    className="w-full py-3 px-3.5 rounded-xl border-2 border-[#EAEAEA] text-xs font-bold text-[#1A1A2E] bg-white focus:outline-none focus:border-[#FF9F43]"
                  />
                </div>
              )}
            </div>

            {/* ── 5. PRIVACY & VISIBILITY ────────────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 space-y-3">
              <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2 mb-1">
                <Shield size={16} className="text-[#CE82FF]" /> Privacy & Visibility
              </h3>

              <SettingToggle
                checked={showProgressPublic}
                onChange={setShowProgressPublic}
                icon="📊"
                label="Show My Progress Publicly"
                sublabel="Allow teachers and classmates to see your XP and streak"
              />
              <div className="bg-[#F8F9FF] rounded-xl p-3 border border-[#E8EEFF] text-[10px] font-bold text-[#757575] leading-relaxed">
                🔒 Your email and personal details are always private and never shared with other learners.
              </div>
            </div>

            {/* ── SAVE BUTTON ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-2xl text-xs font-black text-white flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_0_#B71C1C] hover:translate-y-[2px] active:translate-y-[4px]"
                style={{ background: '#E53935' }}
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save All Changes'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border-2 border-[#FFCDD2] text-[#E53935] text-xs font-black hover:bg-[#FFF5F5] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </form>
        )}

        {/* ── 6. CHANGE PASSWORD ───────────────────────────────────────── */}
        {!loading && (
          <form onSubmit={handleChangePassword}>
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
              >
                <h3 className="font-black text-[#1A1A2E] text-sm flex items-center gap-2.5">
                  <Lock size={16} className="text-[#FF4757]" /> Change Password
                </h3>
                <ChevronRight size={16} className={`text-[#BDBDBD] transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
              </button>

              {showPasswordSection && (
                <div className="px-5 pb-5 border-t border-[#F5F5F5] pt-4 space-y-3">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">Current Password</label>
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full py-3 pl-3.5 pr-10 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold text-[#1A1A2E] bg-white focus:outline-none focus:border-[#FF4757]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 bottom-3 text-[#BDBDBD] hover:text-[#757575]"
                    >
                      {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">New Password</label>
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full py-3 pl-3.5 pr-10 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold text-[#1A1A2E] bg-white focus:outline-none focus:border-[#FF4757]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 bottom-3 text-[#BDBDBD] hover:text-[#757575]"
                    >
                      {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">Confirm New Password</label>
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full py-3 pl-3.5 pr-10 rounded-xl border-2 text-xs font-semibold focus:outline-none transition-colors ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-[#FF4757] bg-[#FFF0F0] text-[#1A1A2E]'
                          : 'border-[#EAEAEA] bg-white focus:border-[#FF4757] text-[#1A1A2E]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 bottom-3 text-[#BDBDBD] hover:text-[#757575]"
                    >
                      {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[10px] font-black text-[#FF4757] flex items-center gap-1">
                      <AlertCircle size={11} /> Passwords do not match
                    </p>
                  )}
                  {newPassword.length >= 6 && confirmPassword === newPassword && (
                    <p className="text-[10px] font-black text-[#20BF6B] flex items-center gap-1">
                      <Check size={11} /> Passwords match ✓
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                    className="w-full py-3 rounded-xl text-xs font-black text-white transition-all disabled:opacity-40 cursor-pointer"
                    style={{ background: '#FF4757' }}
                  >
                    {changingPassword ? 'Updating...' : '🔐 Update Password'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* ── 7. DANGER ZONE ───────────────────────────────────────────── */}
        {!loading && (
          <div className="bg-white rounded-3xl border-2 border-[#FFCDD2] border-b-[4px] border-b-[#FFAAAA] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDangerSection(!showDangerSection)}
              className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
            >
              <h3 className="font-black text-[#FF4757] text-sm flex items-center gap-2.5">
                <Trash2 size={16} /> Danger Zone
              </h3>
              <ChevronRight size={16} className={`text-[#FF4757] transition-transform ${showDangerSection ? 'rotate-90' : ''}`} />
            </button>

            {showDangerSection && (
              <div className="px-5 pb-5 border-t border-[#FFE4E6] pt-4 space-y-3">
                <div className="bg-[#FFF0F0] rounded-xl p-3 border border-[#FFCDD2] text-xs font-bold text-[#FF4757] leading-relaxed">
                  ⚠️ Deleting your account is <strong>permanent and irreversible</strong>. All XP, streaks, and data will be erased forever.
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#9E9E9E] block mb-1.5">
                    Type <strong className="text-[#FF4757]">DELETE</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                    placeholder="Type DELETE here"
                    className="w-full py-3 px-3.5 rounded-xl border-2 border-[#FFCDD2] text-xs font-bold focus:outline-none focus:border-[#FF4757] text-[#FF4757] placeholder-[#FFAAAA] bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={deleteConfirm !== 'DELETE'}
                  onClick={() => alert('Please contact admin to delete your account.')}
                  className="w-full py-3 rounded-xl text-xs font-black text-white transition-all disabled:opacity-30 cursor-pointer"
                  style={{ background: '#FF4757' }}
                >
                  🗑️ Permanently Delete My Account
                </button>
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}


