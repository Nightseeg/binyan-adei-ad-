import React from 'react';
import { ArrowRight, LogIn, Quote } from 'lucide-react';

interface HomePageProps {
    onNavigate: (view: 'register' | 'dashboard' | 'candidate-login') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="w-full flex flex-col items-center bg-transparent font-sans text-wedding-navy selection:bg-wedding-rose/30 py-20">

            <div className="w-full max-w-4xl mx-auto px-6 text-center animate-fade-in relative z-10 mb-32">

                {/* Decorative Script Element */}
                <div className="font-serif italic text-3xl md:text-4xl text-wedding-gold mb-4 opacity-90" style={{ fontFamily: 'Playfair Display, serif' }}>
                    B'Siyata Dishmaya
                </div>

                {/* Main Heading */}
                <h1 className="text-7xl md:text-9xl font-serif font-bold tracking-tight mb-2 text-wedding-navy drop-shadow-sm leading-none">
                    Binyan Adei Ad
                </h1>
                <div className="text-sm md:text-lg font-sans font-bold text-wedding-gold/60 uppercase tracking-[0.3em] mb-8">
                    by Torat Yaacov
                </div>

                {/* Subtitle with lines */}
                <div className="flex items-center justify-center gap-4 mb-16">
                    <div className="h-px bg-wedding-gold w-12 md:w-24 opacity-60"></div>
                    <p className="text-2xl md:text-3xl text-wedding-text font-light tracking-widest uppercase" style={{ letterSpacing: '0.2em' }}>
                        Le Shidduch d'Excellence
                    </p>
                    <div className="h-px bg-wedding-gold w-12 md:w-24 opacity-60"></div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <button
                        onClick={() => onNavigate('register')}
                        className="w-full sm:w-auto px-12 py-5 bg-wedding-navy text-white text-lg font-bold rounded-full hover:bg-opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-wedding-navy"
                    >
                        Créer mon Profil
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => onNavigate('candidate-login')}
                        className="w-full sm:w-auto px-12 py-5 bg-white/80 backdrop-blur-sm text-wedding-navy border border-wedding-navy/20 text-lg font-bold rounded-full hover:bg-white hover:border-wedding-gold transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-xl"
                    >
                        <LogIn className="w-5 h-5" />
                        Mon Compte
                    </button>
                </div>

                {/* Trust Badge */}
                <div className="mt-16 text-sm text-wedding-text/60 font-medium tracking-wide">
                    CONFIDENTIALITÉ ABSOLUE • ACCOMPAGNEMENT PERSONNALISÉ
                </div>
            </div>

            {/* Nos Rabbanim Section */}
            <section className="w-full max-w-5xl mx-auto px-6 py-24 animate-fade-in border-t border-wedding-gold/10 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-serif font-bold text-wedding-navy tracking-tight mb-4">
                        Nos Rabbanim
                    </h2>
                    <p className="text-wedding-gold font-serif italic text-xl">Le soutien spirituel de notre communauté</p>
                    <div className="w-24 h-px bg-wedding-gold/30 mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="glass-card p-10 rounded-3xl border-wedding-gold/10 text-center group hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-wedding-navy/5">
                        <Quote className="w-8 h-8 text-wedding-gold/20 mx-auto mb-6 group-hover:text-wedding-gold transition-colors" />
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-2">Rav A. Dreyfuss</h4>
                        <div className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em] mb-4">Conseiller Spirituel</div>
                        <p className="text-sm text-wedding-navy/60 italic leading-relaxed">
                            "Une initative précieuse pour la pérennité de nos foyers."
                        </p>
                    </div>

                    <div className="glass-card p-10 rounded-3xl border-wedding-gold/10 text-center group hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-wedding-navy/5">
                        <Quote className="w-8 h-8 text-wedding-gold/20 mx-auto mb-6 group-hover:text-wedding-gold transition-colors" />
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-2">Rav Y. Rottenberg</h4>
                        <div className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em] mb-4">Kahal Chassidim</div>
                        <p className="text-sm text-wedding-navy/60 italic leading-relaxed">
                            "Un service d'exception alliant modernité et traditions."
                        </p>
                    </div>

                    <div className="glass-card p-10 rounded-3xl border-wedding-gold/10 text-center group hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-wedding-navy/5">
                        <Quote className="w-8 h-8 text-wedding-gold/20 mx-auto mb-6 group-hover:text-wedding-gold transition-colors" />
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-2">Rav M. Sitruk</h4>
                        <div className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em] mb-4">Beth Hamidrash</div>
                        <p className="text-sm text-wedding-navy/60 italic leading-relaxed">
                            "Binyan Adei Ad est devenu une référence incontournable."
                        </p>
                    </div>
                </div>

                <div className="mt-20 text-center italic text-wedding-navy/40 text-xs tracking-widest uppercase font-bold">
                    Sous la direction halakhique de nos maîtres
                </div>
            </section>
        </div>
    );
};

export default HomePage;

