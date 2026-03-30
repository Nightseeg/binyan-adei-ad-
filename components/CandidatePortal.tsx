import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { api } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import RegistrationForm from './RegistrationForm';
import { MessageCircle, User, LogOut, Send, Loader2, X, Phone, Mail, MapPin, Clock, Users, Heart, Check } from 'lucide-react';

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
    const [showShadchanDetails, setShowShadchanDetails] = useState(false);
    const [showShadchanSelector, setShowShadchanSelector] = useState(false);
    const [shadchansList, setShadchansList] = useState<any[]>([]);
    const [isUpdatingShadchan, setIsUpdatingShadchan] = useState(false);

    useEffect(() => {
        const fetchShadchans = async () => {
            try {
                const data = await api.getShadchans();
                setShadchansList(data || []);
            } catch (err) {
                console.error("Erreur chargement Shadchanim", err);
            }
        };
        fetchShadchans();
    }, []);

    useEffect(() => {
        const loadShadchan = async () => {
            // Only load shadchan if one is actually assigned
            if (candidate.assignedShadchanId) {
                try {
                    const sp = await api.getShadchanProfile(candidate.assignedShadchanId);
                    setShadchanProfile(sp);
                } catch (e) {
                    console.error("Could not load shadchan profile", e);
                }
            } else {
                setShadchanProfile(null);
            }
            setInitialLoadComplete(true);
        };
        loadShadchan();
    }, [candidate.assignedShadchanId]);

    useEffect(() => {
        if (activeTab === 'messages') {
            loadMessages();

            // Subscribe to real-time changes
            const channel = supabase
                .channel(`candidate-messages-${candidate.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `profile_id=eq.${candidate.id}`
                    },
                    () => {
                        loadMessages();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [activeTab, candidate.id]);

    const loadMessages = async () => {
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

    const handleChangeShadchan = async (newShadchanId: number) => {
        setIsUpdatingShadchan(true);
        try {
            const updatedProfile = await api.updateProfile({ 
                ...candidate, 
                assignedShadchanId: newShadchanId 
            } as Profile);
            onUpdateProfile(updatedProfile);
            setShowShadchanSelector(false);
            setShowShadchanDetails(false);
            alert("Votre Shadchan a été mis à jour avec succès !");
        } catch (error) {
            console.error("Erreur changement shadchan:", error);
            alert("Erreur lors du changement de Shadchan.");
        } finally {
            setIsUpdatingShadchan(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col font-sans text-wedding-navy">
            {/* Header */}
            <header className="glass-nav fixed top-0 w-full z-50 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center shadow-lg shadow-wedding-navy/5">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-wedding-navy rounded-2xl flex items-center justify-center text-wedding-gold font-serif font-bold text-xl md:text-2xl shadow-xl border border-wedding-gold/20 shadow-wedding-navy/20">
                        {candidate.firstName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-lg md:text-xl text-wedding-navy leading-tight">Bonjour, {candidate.firstName}</h1>
                        <p className="text-[8px] md:text-[10px] text-wedding-gold font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase">Mon Espace Personnel</p>
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
            <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 py-6 md:py-8 pt-24 md:pt-28">

                {/* Navigation Tabs */}
                <div className="flex p-1 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 mb-6 md:mb-10 w-full sm:w-fit shadow-xl shadow-wedding-navy/5">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${activeTab === 'messages' ? 'bg-wedding-navy text-wedding-gold shadow-2xl' : 'text-wedding-navy/60 hover:text-wedding-navy hover:bg-white/50'}`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-wedding-navy text-wedding-gold shadow-2xl' : 'text-wedding-navy/60 hover:text-wedding-navy hover:bg-white/50'}`}
                    >
                        <User className="w-4 h-4" />
                        Mon Profil
                    </button>
                </div>

                {activeTab === 'messages' ? (
                    <div className="glass-card rounded-3xl overflow-hidden h-[500px] md:h-[600px] flex flex-col shadow-2xl shadow-wedding-navy/10 animate-fade-in">
                        <div className="p-4 md:p-6 border-b border-wedding-navy/5 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                            <div
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setShowShadchanDetails(true)}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-wedding-navy/5 flex items-center justify-center border-2 border-white shadow-inner overflow-hidden">
                                        {shadchanProfile?.image_url ?
                                            <img src={shadchanProfile.image_url} alt="Shadchan" className="w-full h-full object-cover" /> :
                                            <div className="text-xl font-serif font-bold text-wedding-navy">{shadchanProfile?.name?.charAt(0) || 'S'}</div>
                                        }
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-wedding-navy text-lg leading-none mb-1">{shadchanProfile?.name || 'Votre Shadchan'}</h3>
                                    <p className="text-[10px] text-green-600 font-bold">En ligne</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-white/30 backdrop-blur-sm relative">
                            {(!shadchanProfile && messages.filter(m => m.direction === 'FROM_SHADCHAN').length === 0 && initialLoadComplete) ? (
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

                                    <button 
                                        onClick={() => setShowShadchanSelector(true)}
                                        className="mt-6 px-6 py-3 bg-white text-wedding-navy border border-wedding-navy/10 rounded-xl font-bold hover:bg-wedding-navy/5 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                                    >
                                        <Users className="w-4 h-4" />
                                        Choisir mon Shadchan maintenant
                                    </button>

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
                                        <div className={`max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-3xl text-sm shadow-xl ${msg.direction === 'FROM_CANDIDATE' ?
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

                        <div className="p-4 md:p-6 bg-white backdrop-blur-md border-t border-wedding-navy/5 relative z-20">
                            <div className="flex gap-2 md:gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={(!shadchanProfile && messages.length === 0) || !candidate.assignedShadchanId ? "Messagerie indisponible..." : "Écrivez votre message..."}
                                    disabled={isLoading || !candidate.assignedShadchanId}
                                    className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-wedding-navy/5 border border-wedding-navy/10 rounded-2xl focus:outline-none focus:border-wedding-gold transition-all font-medium text-sm md:text-base text-wedding-navy placeholder:text-wedding-navy/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !newMessage.trim() || !candidate.assignedShadchanId}
                                    className="p-3 md:p-4 bg-wedding-navy text-wedding-gold rounded-2xl hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
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
            {/* Shadchan Details Modal */}
            {showShadchanDetails && shadchanProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-wedding-navy/40 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden relative border border-wedding-navy/5 animate-scale-in">
                        <button
                            onClick={() => setShowShadchanDetails(false)}
                            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 z-50 group border border-white/5"
                        >
                            <X className="w-4 h-4 text-white/90 group-hover:text-white group-hover:rotate-90 transition-transform" />
                        </button>

                        <div className="h-32 bg-wedding-navy relative">
                            {/* Decorative Pattern Overlay */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>

                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
                                <div className="w-24 h-24 rounded-full border-[4px] border-white shadow-xl overflow-hidden bg-white flex items-center justify-center ring-1 ring-black/5">
                                    {shadchanProfile.image_url ?
                                        <img src={shadchanProfile.image_url} alt="Profile" className="w-full h-full object-cover" /> :
                                        <span className="text-3xl font-serif font-bold text-wedding-navy">{shadchanProfile.name?.charAt(0)}</span>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="pt-16 pb-8 px-8 text-center bg-white relative z-10">
                            <h2 className="text-2xl font-serif font-bold text-wedding-navy mb-1">{shadchanProfile.name}</h2>
                            <p className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em] mb-8 border-b border-wedding-navy/5 pb-4 inline-block px-4">{shadchanProfile.role || 'Shadchan Senior'}</p>

                            <div className="space-y-4 text-left">
                                {shadchanProfile.email && (
                                    <div className="flex items-center gap-4 p-4 bg-wedding-navy/5 rounded-2xl border border-wedding-navy/5 hover:border-wedding-gold/30 transition-colors group">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-wedding-navy group-hover:scale-110 transition-transform duration-300">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-0.5">Email</p>
                                            <p className="text-sm font-bold text-wedding-navy truncate">{shadchanProfile.email}</p>
                                        </div>
                                    </div>
                                )}

                                {shadchanProfile.phone && (
                                    <div className="flex items-center gap-4 p-4 bg-wedding-navy/5 rounded-2xl border border-wedding-navy/5 hover:border-wedding-gold/30 transition-colors group">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-wedding-navy group-hover:scale-110 transition-transform duration-300">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-0.5">Téléphone</p>
                                            <p className="text-sm font-bold text-wedding-navy">{shadchanProfile.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600">
                                        <div className="relative">
                                            <div className="absolute right-0 top-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-green-800/40 uppercase tracking-widest mb-0.5">Statut</p>
                                        <p className="text-sm font-bold text-green-700">Disponible</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowShadchanDetails(false);
                                    setShowShadchanSelector(true);
                                }}
                                className="mt-8 w-full py-4 bg-white text-wedding-navy rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-wedding-navy/5 transition-all shadow-sm active:scale-95 border border-wedding-navy/10 mb-3"
                            >
                                Changer de Shadchan
                            </button>

                            <button
                                onClick={async () => {
                                    if (window.confirm("Êtes-vous sûr de vouloir mettre fin à la discussion avec ce Shadchan ? Votre profil redeviendra disponible pour les autres.")) {
                                        setIsUpdatingShadchan(true);
                                        try {
                                            const updatedProfile = await api.updateProfile({ 
                                                ...candidate, 
                                                assignedShadchanId: null 
                                            } as Profile);
                                            onUpdateProfile(updatedProfile);
                                            setShowShadchanDetails(false);
                                            alert("Discussion terminée. Vous pouvez maintenant choisir un nouveau Shadchan ou attendre d'être contacté.");
                                        } catch (error) {
                                            console.error("Erreur lors de la fin de discussion:", error);
                                            alert("Erreur lors de l'opération.");
                                        } finally {
                                            setIsUpdatingShadchan(false);
                                        }
                                    }
                                }}
                                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-100 transition-all shadow-sm active:scale-95 border border-red-200 mb-3"
                            >
                                Mettre fin à la discussion
                            </button>

                            <button
                                onClick={() => setShowShadchanDetails(false)}
                                className="w-full py-4 bg-wedding-navy text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 active:scale-95 border border-wedding-gold/10"
                            >
                                Fermer la fiche
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shadchan Selector Modal */}
            {showShadchanSelector && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-wedding-navy/40 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full relative border border-wedding-navy/5 animate-scale-in my-8">
                        <div className="p-6 md:p-8 border-b border-wedding-navy/5 flex justify-between items-center bg-gray-50/50 rounded-t-[2rem]">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-wedding-navy">Choisissez votre Shadchan</h3>
                                <p className="text-sm text-wedding-navy/60 font-medium mt-1">Sélectionnez le Shadchan avec lequel vous souhaitez échanger.</p>
                            </div>
                            <button
                                onClick={() => setShowShadchanSelector(false)}
                                className="p-2.5 bg-white hover:bg-gray-100 rounded-full transition-all duration-300 shadow-sm border border-gray-200"
                            >
                                <X className="w-5 h-5 text-wedding-navy/60 hover:text-wedding-navy" />
                            </button>
                        </div>

                        <div className="p-6 md:p-8">
                            {shadchansList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {shadchansList.map(shadchan => (
                                        <div 
                                            key={shadchan.id}
                                            className={`rounded-2xl border ${candidate.assignedShadchanId === shadchan.id ? 'border-wedding-gold bg-wedding-gold/5 ring-2 ring-wedding-gold/50' : 'border-wedding-navy/10 bg-white hover:border-wedding-navy/30 hover:shadow-xl hover:-translate-y-1'} p-6 flex flex-col items-center text-center transition-all duration-300 relative group overflow-hidden`}
                                        >
                                            {candidate.assignedShadchanId === shadchan.id && (
                                                <div className="absolute top-4 right-4 bg-wedding-gold text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                                    <Check className="w-3 h-3" /> Actuel
                                                </div>
                                            )}
                                            
                                            <div className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-white shadow-xl mb-5 relative z-10" style={{ backgroundImage: `url(${shadchan.image_url || '/placeholder-avatar.png'})`, backgroundColor: shadchan.image_url ? 'transparent' : '#f3f4f6' }}>
                                                {!shadchan.image_url && <User className="w-10 h-10 text-wedding-navy/20 m-auto mt-6" />}
                                            </div>
                                            
                                            <h4 className="font-bold text-xl text-wedding-navy font-serif mb-1 group-hover:text-wedding-gold transition-colors">{shadchan.name}</h4>
                                            
                                            {shadchan.speciality && (
                                                <p className="text-xs text-wedding-gold font-bold uppercase tracking-wider mb-4 px-3 py-1 bg-wedding-gold/10 rounded-full">{shadchan.speciality}</p>
                                            )}
                                            
                                            <button
                                                onClick={() => handleChangeShadchan(shadchan.id)}
                                                disabled={candidate.assignedShadchanId === shadchan.id || isUpdatingShadchan}
                                                className={`mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                    candidate.assignedShadchanId === shadchan.id 
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-wedding-navy text-white hover:bg-wedding-navy/90 shadow-md hover:shadow-lg active:scale-95'
                                                }`}
                                            >
                                                {isUpdatingShadchan && candidate.assignedShadchanId !== shadchan.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : candidate.assignedShadchanId === shadchan.id ? (
                                                    'Shadchan Actuel'
                                                ) : (
                                                    'Choisir ce Shadchan'
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <Loader2 className="w-10 h-10 text-wedding-gold animate-spin mb-4" />
                                    <p className="text-wedding-navy/60 font-medium">Chargement des Shadchanim...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidatePortal;
