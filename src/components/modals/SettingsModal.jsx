// components/modals/SettingsModal.jsx
import React, { useCallback, memo } from 'react';
import { Database, XCircle, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const THEME = {
    panel: 'bg-[#121217]',
    border: 'border-white/10',
};

const SettingsModal = memo(({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
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

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${THEME.panel} rounded-xl border ${THEME.border} shadow-2xl max-w-md w-full`}>
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Database size={18} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Manage Data</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
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