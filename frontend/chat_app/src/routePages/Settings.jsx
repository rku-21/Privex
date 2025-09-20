import React, { useState } from 'react';
import { ChevronRight, User, Bell, Lock, HelpCircle, Heart, Users, Archive, Star, Download, Trash2, Moon, Sun, Volume2 } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export default function ChatSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const {theme}=useThemeStore();
  
  const SettingsItem = ({ icon: Icon, title, subtitle, onClick, hasToggle, toggleValue, onToggle, hasChevron = true }) => (
    <div 
      className={`flex items-center p-4 border-b border-gray-100 ${theme ? 'border-gray-700 bg-gray-800' : 'bg-white'} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${darkMode && onClick ? 'hover:bg-gray-700' : ''}`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${theme ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 ${theme ? 'text-gray-300' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1">
        <div className={`font-medium ${theme ? 'text-white' : 'text-gray-900'}`}>{title}</div>
        {subtitle && <div className={`text-sm ${theme? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</div>}
      </div>
      {hasToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!toggleValue);
          }}
          className={`w-12 h-6 rounded-full transition-colors duration-200 ${
            toggleValue ? 'bg-green-500' : theme ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
              toggleValue ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      )}
      {hasChevron && !hasToggle && (
        <ChevronRight className={`w-5 h-5 ${theme ? 'text-gray-400' : 'text-gray-400'}`} />
      )}
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div className={`px-4 py-2 ${theme ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'} text-sm font-medium uppercase tracking-wide`}>
      {title}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${theme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center p-4">

          <button className={`mr-4 p-1 ${theme ? 'text-white' : 'text-gray-900'}`}
          onClick={()=>window.history.back()}>
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>

          <h1 className={`text-xl font-semibold ${theme ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className={`${theme ? 'bg-gray-800' : 'bg-white'} border-b ${theme ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center p-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-xl font-semibold">JD</span>
          </div>
          <div className="flex-1">
            <div className={`text-lg font-semibold ${theme ? 'text-white' : 'text-gray-900'}`}>John Doe</div>
            <div className={`${theme ? 'text-gray-400' : 'text-gray-500'}`}>Hey there! I am using ChatApp.</div>
          </div>
          <ChevronRight className={`w-5 h-5 ${theme ? 'text-gray-400' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-0">
        <SectionHeader title="Account" />
        <SettingsItem 
          icon={Lock} 
          title="Privacy" 
          subtitle="Last seen, profile photo, about"
          onClick={() => console.log('Privacy clicked')}
        />
        <SettingsItem 
          icon={Lock} 
          title="Security" 
          subtitle="Two-step verification, change number"
          onClick={() => console.log('Security clicked')}
        />

        <SectionHeader title="Preferences" />
        <SettingsItem 
          icon={theme ? Sun : Moon} 
          title="Dark Mode" 
          subtitle="Switch between light and dark themes"
          hasToggle={true}
          toggleValue={darkMode}
          onToggle={setDarkMode}
          hasChevron={false}
        />
        <SettingsItem 
          icon={Bell} 
          title="Notifications" 
          subtitle="Message, group & call tones"
          hasToggle={true}
          toggleValue={notifications}
          onToggle={setNotifications}
          hasChevron={false}
        />
        <SettingsItem 
          icon={Download} 
          title="Storage and data" 
          subtitle="Network usage, auto-download"
          onClick={() => console.log('Storage clicked')}
        />

        <SectionHeader title="Chats" />
        <SettingsItem 
          icon={Archive} 
          title="Chat backup" 
          subtitle="Back up to Google Drive"
          onClick={() => console.log('Backup clicked')}
        />
        <SettingsItem 
          icon={Star} 
          title="Starred messages" 
          subtitle="View your starred messages"
          onClick={() => console.log('Starred clicked')}
        />

        <SectionHeader title="More" />
        <SettingsItem 
          icon={Users} 
          title="Invite friends" 
          subtitle="Share ChatApp with friends"
          onClick={() => console.log('Invite clicked')}
        />
        <SettingsItem 
          icon={HelpCircle} 
          title="Help" 
          subtitle="Help center, contact us, privacy policy"
          onClick={() => console.log('Help clicked')}
        />
      </div>

      {/* Footer */}
      <div className={`p-6 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
        <div>ChatApp v2.24.1</div>
        <div className="mt-2">Made with <Heart className="w-4 h-4 inline text-red-500" /> by Your Team</div>
      </div>
    </div>
  );
}