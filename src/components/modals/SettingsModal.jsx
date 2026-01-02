// components/modals/SettingsModal.jsx
import React, { useState, useCallback, useEffect, memo } from 'react';
import { Settings, XCircle, LogOut, Trash2, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const THEME = {
    panel: 'bg-[#121217]',
    border: 'border-white/10',
};

const SettingsModal = memo(({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({
        notifications: false,
        autoRefresh: true,
    });

    useEffect(() => {
        const saved = localStorage.getItem('trustCenterSettings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    const handleSettingChange = useCallback(async (key) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem('trustCenterSettings', JSON.stringify(updated));

            // Request notification permission if enabling notifications
            if (key === 'notifications' && !prev[key]) {
                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }

            return updated;
        });
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        onClose();
    }, [logout, onClose]);

    const handleDataDeletion = useCallback(() => {
        const subject = encodeURIComponent('Data Deletion Request - Trust Center');
        const body = encodeURIComponent(
            `I am requesting deletion of my data from the Meridian Trust Center.\n\n` +
            `Agency: ${user?.agency || 'N/A'}\n` +
            `Email: ${user?.email || 'N/A'}\n\n` +
            `Please delete:\n` +
            `- Access token\n` +
            `- Access logs\n` +
            `- Any other stored personal data\n\n` +
            `Thank you.`
        );
        window.location.href = `mailto:fedramp-security@meridianks.com?subject=${subject}&body=${body}`;
    }, [user]);

    if (!isOpen) return null;

    const notificationPermission = 'Notification' in window ? Notification.permission : 'denied';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${THEME.panel} rounded-xl border ${THEME.border} shadow-2xl max-w-md w-full`}>
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Settings size={18} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-tight">System Settings</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Preferences</h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Bell size={16} className="text-slate-400" />
                                    <span className="text-sm text-slate-300">Enable Notifications</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={() => handleSettingChange('notifications')}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                />
                            </label>
                            {settings.notifications && notificationPermission === 'denied' && (
                                <p className="text-[10px] text-amber-400 px-3">Browser notifications blocked. Enable in browser settings.</p>
                            )}

                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={16} className="text-slate-400" />
                                    <span className="text-sm text-slate-300">Auto-refresh Data</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.autoRefresh}
                                    onChange={() => handleSettingChange('autoRefresh')}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                />
                            </label>
                            {settings.autoRefresh && (
                                <p className="text-[10px] text-slate-400 px-3">Data refreshes every 5 minutes</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account</h3>
                        <div className="space-y-2">
                            <button
                                onClick={handleLogout}
                                className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                            <button
                                onClick={handleDataDeletion}
                                className="w-full p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Trash2 size={16} />
                                Request Data Deletion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default SettingsModal;