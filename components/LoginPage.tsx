import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ArrowLeft } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: () => void;
    onCancel: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Set the security key for RLS policies
            localStorage.setItem('shadchan_key', 'lev-echad-admin-2025');

            onLoginSuccess();
        } catch (error: any) {
            alert("Erreur de connexion: " + error.message);
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
                        <div>
                            <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-wedding-navy/70 uppercase tracking-widest mb-2">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border-wedding-rose bg-white/50 px-4 py-3 text-wedding-navy placeholder:text-wedding-text/40 focus:border-wedding-gold focus:bg-white focus:ring-0 transition-all shadow-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>

                        <button
                            onClick={handleLogin}
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
                    </div>
                </div>
            </div>

            <button
                onClick={onCancel}
                className="fixed bottom-6 left-6 md:bottom-8 md:left-24 text-xs md:text-sm text-wedding-navy hover:text-white hover:bg-wedding-navy font-bold flex items-center gap-2 transition-all bg-white/80 px-4 py-2 md:px-5 md:py-2.5 rounded-full backdrop-blur-md shadow-lg border border-white/50 z-50 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <span className="hidden xs:inline">Retour à l'accueil</span><span className="xs:hidden">Retour</span>
            </button>
        </div>
    );
};

export default LoginPage;
