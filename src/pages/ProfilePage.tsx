import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface UserSettings {
  user_id: string;
  work_settings: any;
  leave_balance: any;
  theme_settings: any;
  created_at: string;
  updated_at: string;
}

interface DatabaseStats {
  totalTimeEntries: number;
  totalLeaveRequests: number;
  totalStatusItems: number;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
  totalWorkedHours: number;
}

// SVG Icons
const RefreshIcon = ({ className, spinning }: { className?: string; spinning?: boolean }) => (
  <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UserIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 2 3 8 3s8-1 8-3V7M4 7c0 2 2 3 8 3s8-1 8-3M4 7c0-2 2-3 8-3s8 1 8 3m0 5c0 2-2 3-8 3s-8-1-8-3" />
  </svg>
);

const SettingsIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SmartphoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // 1. Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUser(currentUser);

      if (!currentUser) return;

      // 2. Get user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (!settingsError) {
        setUserSettings(settings);
      }

      // 3. Get database statistics
      await loadStatistics(currentUser.id);

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (userId: string) => {
    try {
      // Count time entries
      const { count: entriesCount } = await supabase
        .from('time_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count leave requests
      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count status items
      const { count: statusCount } = await supabase
        .from('status_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get first and last entry dates + total hours
      const { data: entries } = await supabase
        .from('time_entries')
        .select('date, duration')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      const firstEntry = entries?.[0]?.date || null;
      const lastEntry = entries?.[entries.length - 1]?.date || null;
      const totalHours = entries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0;

      setStats({
        totalTimeEntries: entriesCount || 0,
        totalLeaveRequests: leaveCount || 0,
        totalStatusItems: statusCount || 0,
        firstEntryDate: firstEntry,
        lastEntryDate: lastEntry,
        totalWorkedHours: totalHours,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Utente non autenticato</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Profilo Utente</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-teal-600 transition-colors"
          title="Aggiorna dati"
        >
          <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {user.user_metadata?.full_name || 'Utente'}
            </h2>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MailIcon className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <UserIconSvg className="w-4 h-4" />
              <span>ID: {user.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Account creato</p>
              <p className="text-sm font-medium text-gray-800">
                {user.created_at ? formatDate(user.created_at) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Ultimo accesso</p>
              <p className="text-sm font-medium text-gray-800">
                {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}
              </p>
            </div>
          </div>

          {user.email_confirmed_at && (
            <div className="flex items-center gap-3">
              <MailIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Email verificata</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(user.email_confirmed_at)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <SmartphoneIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="text-sm font-medium text-gray-800">
                {user.app_metadata?.provider || 'email'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-teal-600" />
            Statistiche Database
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-teal-600">{stats.totalTimeEntries}</p>
              <p className="text-xs text-gray-600 mt-1">Timbrature totali</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{stats.totalLeaveRequests}</p>
              <p className="text-xs text-gray-600 mt-1">Richieste ferie</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-purple-600">{stats.totalStatusItems}</p>
              <p className="text-xs text-gray-600 mt-1">Eventi calendario</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">
                {formatHours(stats.totalWorkedHours)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Ore lavorate</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-600">
                {stats.firstEntryDate 
                  ? new Date(stats.firstEntryDate).toLocaleDateString('it-IT')
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Prima timbratura</p>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <p className="text-sm font-medium text-pink-600">
                {stats.lastEntryDate 
                  ? new Date(stats.lastEntryDate).toLocaleDateString('it-IT')
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Ultima timbratura</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Card */}
      {userSettings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <SettingsIconSvg className="w-5 h-5 text-teal-600" />
            Impostazioni Utente
          </h3>

          <div className="space-y-4">
            {/* Work Settings */}
            <div className="border-l-4 border-teal-500 pl-4">
              <h4 className="font-medium text-gray-700 mb-2">Impostazioni Lavoro</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Ore settimanali: <span className="font-medium">{userSettings.work_settings?.weeklyHours || 0}h</span></p>
                <p>Turni configurati: <span className="font-medium">{userSettings.work_settings?.shifts?.length || 0}</span></p>
                {userSettings.work_settings?.workLocation && (
                  <div className="flex items-center gap-2 mt-2">
                    <MapPinIcon className="w-4 h-4 text-teal-600" />
                    <span>Geofencing attivo: {userSettings.work_settings.workLocation.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Balance */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-700 mb-2">Saldo Ferie</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Ferie: <span className="font-medium">{userSettings.leave_balance?.vacation || 0} giorni</span></p>
                <p>Permessi: <span className="font-medium">{userSettings.leave_balance?.personalLeave || 0} giorni</span></p>
                <p>Malattia: <span className="font-medium">{userSettings.leave_balance?.sickLeave || 0} giorni</span></p>
              </div>
            </div>

            {/* Theme Settings */}
            {userSettings.theme_settings && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-gray-700 mb-2">Tema</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Modalità: <span className="font-medium">{userSettings.theme_settings.mode || 'system'}</span></p>
                  <p>Colore: <span className="font-medium">{userSettings.theme_settings.accentColor || 'teal'}</span></p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>Impostazioni create: {formatDate(userSettings.created_at)}</p>
              <p>Ultimo aggiornamento: {formatDate(userSettings.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Card (for debugging) */}
      <details className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
        <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
          <DatabaseIcon className="w-4 h-4" />
          Dati Grezzi (Debug)
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">User Object</h4>
            <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-64 border border-gray-200">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          {userSettings && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">User Settings</h4>
              <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-64 border border-gray-200">
                {JSON.stringify(userSettings, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSignOut}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          <LogOutIcon className="w-5 h-5" />
          Disconnetti
        </button>
      </div>
    </div>
  );
}
