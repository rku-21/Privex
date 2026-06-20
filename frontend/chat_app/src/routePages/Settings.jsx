import React, { useState } from 'react';
import { ChevronRight, User, Bell, Lock, HelpCircle, Heart, Users, Archive, Star, Download, Trash2, Moon, Sun, Volume2 } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
export default function ChatSettings() {
  const Navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const { theme, toggleTheme } = useThemeStore();

return (
    <div className="min-h-screen bg-bg">

      {/* {/*Top header bar } */}
      <div className="sticky top-0 z-10 bg-bg border-b border-border">
        <div className="flex items-center p-4">
          <button className="mr-4 p-1 text-text" onClick={() => window.history.back()}>
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-xl font-semibold text-text">Settings</h1>
        </div>
      </div>

      {/* Profile card  */}
      <div className="bg-surface border-b border-border">
        <div className="flex items-center p-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
            <img
              className="w-16 h-16 rounded-full object-cover"
              onClick={() => Navigate('/profile')}
              src={authUser?.profilePicture ? authUser.profilePicture : "avatar.png"}
            />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-text"></div>
            <div className="text-muted">Hey there! I am using Privex</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" onClick={() => Navigate('/profile')} />
        </div>
      </div>

      <div className="space-y-0">

        {/*  Section: Account */}
        <div className="px-4 py-2 bg-surface text-muted text-sm font-medium uppercase tracking-wide">
          Account
        </div>

        {/* Privacy */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Privacy clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Lock className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Privacy</div>
            <div className="text-sm text-muted">Last seen, profile photo, about</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* Security */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Security clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Lock className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Security</div>
            <div className="text-sm text-muted">Two-step verification, change number</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* Preferences  */}
        <div className="px-4 py-2 bg-surface text-muted text-sm font-medium uppercase tracking-wide">
          Preferences
        </div>

        {/* Dark Mode toggle */}
        <div className="flex items-center p-4 border-b border-border bg-bg hover:bg-hover-surface">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-muted" />
            ) : (
              <Sun className="w-5 h-5 text-muted" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Dark Mode</div>
            <div className="text-sm text-muted">Switch between light and dark themes</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className={`w-12 h-6 rounded-full  transition-colors border border-border duration-200 ${
              theme === 'dark' ? 'bg-emerald-500' : 'bg-toggle-off'
            }`}
          >
            <div
              className={`w-5 h-5  ${theme=='dark'?'bg-white':'bg-gray-600'} rounded-full transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center p-4 border-b border-border bg-bg hover:bg-hover-surface">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface">
            <Bell className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Notifications</div>
            <div className="text-sm text-muted">Message, group & call tones</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotifications(!notifications);
            }}
            className={`w-12 h-6 rounded-full  transition-colors border border-border duration-200 ${
              notifications ? 'bg-green-500' : 'bg-toggle-off'
            }`}
          >
            <div
              className={`w-5 h-5 ${theme=='dark'?'bg-white':'bg-gray-600'} rounded-full transition-transform duration-200 ${
                notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Storage and data */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Storage clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Download className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Storage and data</div>
            <div className="text-sm text-muted">Network usage, auto-download</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* ---------- Section: Chats ---------- */}
        <div className="px-4 py-2 bg-surface text-muted text-sm font-medium uppercase tracking-wide">
          Chats
        </div>

        {/* Chat backup */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Backup clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Archive className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Chat backup</div>
            <div className="text-sm text-muted">Back up to Google Drive</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* Starred messages */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Starred clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Star className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Starred messages</div>
            <div className="text-sm text-muted">View your starred messages</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* ---------- Section: More ---------- */}
        <div className="px-4 py-2 bg-surface text-muted text-sm font-medium uppercase tracking-wide">
          More
        </div>

        {/* Invite friends */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Invite clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <Users className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Invite friends</div>
            <div className="text-sm text-muted">Share ChatApp with friends</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>

        {/* Help */}
        <div
          className="flex items-center p-4 border-b border-border bg-bg cursor-pointer hover:bg-hover-surface"
          onClick={() => console.log('Help clicked')}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-surface hover:bg-hover-surface">
            <HelpCircle className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text">Help</div>
            <div className="text-sm text-muted">Help center, contact us, privacy policy</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="p-6 text-center text-muted text-sm">
        <div>ChatApp v1.00.0</div>
        <div className="mt-2">Made with rku21</div>
      </div>
    </div>
  );
}