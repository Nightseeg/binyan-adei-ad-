import React from 'react';
import { ArrowRight, LogIn } from 'lucide-react';

interface HomePageProps {
    onNavigate: (view: 'register' | 'dashboard' | 'candidate-login') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="fixed inset-0 top-20 overflow-hidden flex flex-col items-center justify-center bg-transparent font-sans text-wedding-navy selection:bg-wedding-rose/30">

            <main className="w-full max-w-4xl mx-auto px-6 text-center animate-fade-in relative z-10">

                {/* Decorative Script Element */}
                <div className="font-serif italic text-3xl md:text-4xl text-wedding-gold mb-4 opacity-90" style={{ fontFamily: 'Playfair Display, serif' }}>
                    B'Siyata Dishmaya
                </div>

                {/* Main Heading */}
                <h1 className="text-7xl md:text-9xl font-serif font-bold tracking-tight mb-8 text-wedding-navy drop-shadow-sm leading-none">
                    Binyan Adei Ad
                </h1>

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

            </main>
        </div>
    );
};

export default HomePage;

