import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { api } from '../services/dataService';
import RegistrationForm from './RegistrationForm';
import { MessageCircle, User, LogOut, Send, Loader2 } from 'lucide-react';

interface CandidatePortalProps {
    candidate: Profile;
    onLogout: () => void;
    onUpdateProfile: (p: Profile) => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ candidate, onLogout, onUpdateProfile }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'messages'>('messages');
    const [shadchanProfile, setShadchanProfile] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    useEffect(() => {
        const loadShadchan = async () => {
            if (candidate.assignedShadchanId) {
                const sp = await api.getShadchanProfile(candidate.assignedShadchanId);
                setShadchanProfile(sp);
            } else {
                setShadchanProfile(null);
            }
            setInitialLoadComplete(true);
        };
        loadShadchan();
    }, [candidate.assignedShadchanId]);

    useEffect(() => {
        if (activeTab === 'messages' && candidate.assignedShadchanId) {
            loadMessages();
            // Poll for new messages every 10s
            const interval = setInterval(loadMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [activeTab, candidate.assignedShadchanId]);

    const loadMessages = async () => {
        if (!candidate.assignedShadchanId) return;
        try {
            const msgs = await api.getMessages(candidate.id);
            setMessages(msgs || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !candidate.assignedShadchanId) return;
        setIsLoading(true);
        try {
            await api.sendMessage({
                profileId: candidate.id,
                direction: 'FROM_CANDIDATE',
                content: newMessage
            });
            setNewMessage('');
            loadMessages();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'envoi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col font-sans text-wedding-navy">
            {/* Header */}
            <header className="glass-nav fixed top-0 w-full z-50 px-8 py-4 flex justify-between items-center shadow-lg shadow-wedding-navy/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-wedding-navy rounded-2xl flex items-center justify-center text-wedding-gold font-serif font-bold text-2xl shadow-xl border border-wedding-gold/20 shadow-wedding-navy/20">
                        {candidate.firstName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-xl text-wedding-navy leading-tight">Bonjour, {candidate.firstName}</h1>
                        <p className="text-[10px] text-wedding-gold font-bold tracking-[0.2em] uppercase">Mon Espace Personnel</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="p-3 text-wedding-navy/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                    title="Se déconnecter"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full p-6 py-8 pt-28">

                {/* Navigation Tabs */}
                <div className="flex p-1.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 mb-10 w-fit shadow-xl shadow-wedding-navy/5">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'messages' ? 'bg-wedding-navy text-wedding-gold shadow-2xl' : 'text-wedding-navy/60 hover:text-wedding-navy hover:bg-white/50'}`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Mes Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-wedding-navy text-wedding-gold shadow-2xl' : 'text-wedding-navy/60 hover:text-wedding-navy hover:bg-white/50'}`}
                    >
                        <User className="w-4 h-4" />
                        Mon Profil
                    </button>
                </div>

                {activeTab === 'messages' ? (
                    <div className="glass-card rounded-3xl overflow-hidden h-[600px] flex flex-col shadow-2xl shadow-wedding-navy/10 animate-fade-in">
                        <div className="p-6 border-b border-wedding-navy/5 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-wedding-navy/5 flex items-center justify-center border-2 border-white shadow-inner overflow-hidden">
                                    {shadchanProfile?.image_url ?
                                        <img src={shadchanProfile.image_url} alt="Shadchan" className="w-full h-full object-cover" /> :
                                        <div className="text-xl font-serif font-bold text-wedding-navy">{shadchanProfile?.name?.charAt(0) || 'S'}</div>
                                    }
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-wedding-navy text-lg">{shadchanProfile?.name || 'Votre Shadchan'}</h3>
                                    <p className="text-[10px] text-wedding-gold font-bold tracking-widest uppercase">{shadchanProfile?.role || 'Conciergerie Privée'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/30 backdrop-blur-sm relative">
                            {(!shadchanProfile && initialLoadComplete) ? (
                                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-24 h-24 bg-wedding-navy rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-wedding-navy/20 animate-pulse">
                                        <Loader2 className="w-10 h-10 text-wedding-gold animate-spin" />
                                    </div>
                                    <h3 className="font-serif font-bold text-2xl text-wedding-navy mb-3">Dossier en attente</h3>
                                    <p className="text-wedding-navy/70 max-w-md leading-relaxed mb-8">
                                        Votre profil est en attente d'attribution d'un Shadchan dédié.
                                        Vous recevrez une notification et l'accès à la messagerie dès que votre dossier sera pris en charge.
                                    </p>
                                    <div className="bg-white/80 px-6 py-4 rounded-xl border border-wedding-navy/5 shadow-lg">
                                        <p className="text-xs font-bold text-wedding-navy/40 uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-2 text-wedding-gold font-bold">
                                            <span className="w-2 h-2 rounded-full bg-wedding-gold animate-ping"></span>
                                            Recherche de Shadchan...
                                        </div>
                                    </div>

                                    {/* Show candidate's own messages if any */}
                                    {messages.length > 0 && (
                                        <div className="mt-8 w-full max-w-sm border-t border-wedding-navy/10 pt-6">
                                            <p className="text-xs text-wedding-navy/40 uppercase tracking-widest mb-4">Vos messages envoyés</p>
                                            <div className="space-y-3 opacity-60">
                                                {messages.map(msg => (
                                                    <div key={msg.id} className="bg-wedding-navy text-white p-3 rounded-2xl rounded-br-none text-sm text-left shadow-sm">
                                                        {msg.content}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'FROM_CANDIDATE' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-5 rounded-3xl text-sm shadow-xl ${msg.direction === 'FROM_CANDIDATE' ?
                                            'bg-wedding-navy text-white rounded-br-none shadow-wedding-navy/20' :
                                            'bg-white text-wedding-navy rounded-bl-none border border-wedding-navy/5 shadow-black/5'}`}>
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <div className={`text-[9px] mt-2 font-bold tracking-wider ${msg.direction === 'FROM_CANDIDATE' ? 'text-wedding-rose' : 'text-wedding-gold'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-white backdrop-blur-md border-t border-wedding-navy/5 relative z-20">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={!shadchanProfile ? "Messagerie indisponible..." : `Écrivez à ${shadchanProfile?.name || 'votre shadchan'}...`}
                                    disabled={!shadchanProfile || isLoading}
                                    className="flex-1 px-6 py-4 bg-wedding-navy/5 border border-wedding-navy/10 rounded-2xl focus:outline-none focus:border-wedding-gold transition-all font-medium text-wedding-navy placeholder:text-wedding-navy/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!shadchanProfile || isLoading || !newMessage.trim()}
                                    className="p-4 bg-wedding-navy text-wedding-gold rounded-2xl hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-0">
                        <RegistrationForm
                            initialData={candidate}
                            onSave={(updatedProfile) => {
                                onUpdateProfile({ ...updatedProfile, id: candidate.id });
                                alert("Profil mis à jour !");
                            }}
                            onCancel={() => setActiveTab('messages')}
                            onLoginClick={undefined}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default CandidatePortal;
