import React, { useState } from 'react';
import { api } from '../services/dataService';
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2 } from 'lucide-react';
import { Profile } from '../types';

interface CandidateLoginProps {
    onLoginSuccess: (profile: Profile) => void;
    onCancel: () => void;
}

const CandidateLogin: React.FC<CandidateLoginProps> = ({ onLoginSuccess, onCancel }) => {
    const [email, setEmail] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [view, setView] = useState<'login' | 'forgot_password'>('login');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Check if email exists first
            const emailExists = await api.checkEmailExists(email);
            if (!emailExists) {
                setError("Aucun compte n'est associé à cette adresse email.");
                return;
            }

            // Set temporary access code to allow RLS during login check
            try {
                localStorage.setItem('access_code', accessCode);
            } catch (e: any) {
                if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    localStorage.clear();
                    localStorage.setItem('access_code', accessCode);
                }
            }
            const profile = await api.candidateLogin(email.toLowerCase().trim(), accessCode);
            if (profile) {
                onLoginSuccess(profile);
            } else {
                localStorage.removeItem('access_code');
                setError("Le code secret est incorrect.");
            }
        } catch (err) {
            localStorage.removeItem('access_code');
            console.error(err);
            setError("Erreur lors de la connexion. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await api.resetCandidatePassword(email.toLowerCase().trim());
            setMessage('Si l\'adresse correspond à un compte, un email a été envoyé avec votre code.');
        } catch (err) {
            console.error(err);
            setError('Erreur lors de la demande de réinitialisation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
            <div className="w-full max-w-md px-4 flex flex-col">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-wedding-navy rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <LogIn className="w-7 h-7 text-wedding-gold" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-wedding-navy">Mon Compte</h2>
                        <p className="text-wedding-text mt-2 font-light">Accédez à votre dossier confidentiel</p>
                    </div>

                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
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

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest">Code Secret</label>
                                    <button
                                        type="button"
                                        onClick={() => { setView('forgot_password'); setError(''); setMessage(''); }}
                                        className="text-[10px] font-bold text-wedding-gold hover:text-wedding-navy transition-colors uppercase tracking-widest"
                                    >
                                        Code oublié ?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showCode ? "text" : "password"}
                                        required
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                                        placeholder="••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCode(!showCode)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-wedding-text/50 hover:text-wedding-navy transition-colors"
                                    >
                                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-wedding-navy text-white rounded-xl py-4 font-bold uppercase tracking-widest shadow-xl shadow-wedding-navy/20 hover:bg-wedding-navy/90 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-wedding-gold/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "SE CONNECTER"
                            )}
                        </button>

                        <p className="text-[10px] text-wedding-navy/50 font-medium italic text-center max-w-[250px]">
                            Si vous avez oublié votre mot de passe, Merci de nous contacter à l'adresse email suivante: <span className="text-wedding-navy font-bold">binadeiad@gmail.com</span>
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
                                disabled={isLoading}
                                className="w-full py-3.5 bg-wedding-gold text-wedding-navy rounded-xl font-bold shadow-xl hover:bg-wedding-gold/90 hover:-translate-y-0.5 disabled:opacity-70 transition-all flex items-center justify-center gap-2 border border-wedding-gold"
                            >
                                {isLoading ? 'Envoi...' : 'Récupérer mon code'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); setMessage(''); }}
                                className="w-full text-xs font-bold text-wedding-navy/70 hover:text-wedding-navy uppercase tracking-widest transition-colors mt-4"
                            >
                                Retour à la connexion
                            </button>
                        </form>
                    )}
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

export default CandidateLogin;
