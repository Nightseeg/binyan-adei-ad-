import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ArrowLeft } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (shadchanProfile?: any) => void;
    onCancel: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState<'login' | 'forgot_password'>('login');

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Check if shadchan exists first for specific error message
            const { api } = await import('../services/dataService');
            const emailExists = await api.checkShadchanEmailExists(email);
            if (!emailExists) {
                setError("Aucun compte Shadchan n'est associé à cette adresse email.");
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.status === 400 || error.message?.toLowerCase().includes('credentials')) {
                    setError("Le mot de passe est incorrect.");
                } else {
                    setError(error.message || "Erreur de connexion");
                }
                return;
            }

            // Set the security key for RLS policies
            try {
                localStorage.setItem('shadchan_key', import.meta.env.VITE_ADMIN_KEY);
            } catch (e: any) {
                if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    const confirmClear = window.confirm("Votre stockage local est plein. Voulez-vous le vider pour pouvoir vous connecter ? (Cela vous déconnectera de vos autres sessions sur ce site)");
                    if (confirmClear) {
                        localStorage.clear();
                        localStorage.setItem('shadchan_key', import.meta.env.VITE_ADMIN_KEY);
                    } else {
                        throw new Error("Espace de stockage insuffisant dans le navigateur.");
                    }
                } else {
                    throw e;
                }
            }

            // Fetch Shadchan Profile
            try {
                const shadchanProfile = await api.getShadchanByEmail(email);
                onLoginSuccess(shadchanProfile);
            } catch (err) {
                console.error("Error fetching shadchan profile:", err);
                onLoginSuccess(null);
            }
        } catch (err: any) {
            setError(err.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { api } = await import('../services/dataService');
            await api.resetShadchanPassword(email.toLowerCase().trim());
            setMessage('Un email de réinitialisation vous a été envoyé.');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erreur lors de la demande de réinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
            <div className="w-full max-w-md px-4 flex flex-col">
                <div className="flex flex-col items-center justify-center p-10 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50">
                    <h2 className="text-3xl font-serif font-bold text-wedding-navy mb-8">Connexion Shadchan</h2>

                    <div className="w-full space-y-6">
                        {view === 'login' ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest">Mot de passe</label>
                                        <button
                                            type="button"
                                            onClick={() => { setView('forgot_password'); setError(''); setMessage(''); }}
                                            className="text-[10px] font-bold text-wedding-gold hover:text-wedding-navy transition-colors uppercase tracking-widest"
                                        >
                                            Mot de passe oublié ?
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-wedding-navy text-white rounded-xl font-bold shadow-xl hover:bg-wedding-navy/90 hover:-translate-y-0.5 disabled:opacity-70 transition-all border border-wedding-navy"
                                >
                                    {loading ? 'Connexion...' : 'Se connecter'}
                                </button>

                                <div className="text-center pt-6 border-t border-wedding-navy/10">
                                    <p className="text-xs text-wedding-text/70 italic font-serif">
                                        L'accès est réservé aux Shadchanim accrédités.<br />
                                        Contactez l'administrateur pour obtenir un compte.
                                    </p>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                                        placeholder="votre@email.com"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div className="p-3 bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-700 text-sm rounded-xl text-center font-medium">
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-wedding-gold text-wedding-navy rounded-xl font-bold shadow-xl hover:bg-wedding-gold/90 hover:-translate-y-0.5 disabled:opacity-70 transition-all flex items-center justify-center gap-2 border border-wedding-gold"
                                >
                                    {loading ? 'Envoi...' : 'Réinitiliser'}
                                </button>
                                <div className="text-center pt-8 space-y-4">
                                    <p className="text-xs text-wedding-navy/60 font-medium italic">
                                        Si vous avez oublié votre mot de passe, Merci de nous contacter à l'adresse email suivante: <span className="text-wedding-navy font-bold">binadeiad@gmail.com</span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest hover:text-wedding-navy transition-colors"
                                    >
                                        Retour à la connexion
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={onCancel}
                className="fixed top-6 left-6 md:top-8 md:left-24 text-xs md:text-sm text-wedding-navy hover:text-white hover:bg-wedding-navy font-bold flex items-center gap-2 transition-all bg-white/80 px-4 py-2 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg border border-white/50 z-50 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="hidden xs:inline">Retour à l'accueil</span><span className="xs:hidden">Retour</span>
            </button>
        </div>
    );
};

export default LoginPage;
