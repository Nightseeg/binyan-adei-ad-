import React from 'react';
import { HeartHandshake, Moon, Sun } from 'lucide-react';

interface NavbarProps {
    currentView: 'home' | 'register' | 'dashboard' | 'candidate-login' | 'shadchans' | 'donate';
    onNavigate: (view: 'home' | 'register' | 'dashboard' | 'candidate-login' | 'shadchans' | 'donate') => void;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, darkMode, toggleDarkMode }) => {
    return (
        <nav className="glass-nav fixed top-0 left-0 w-full z-50 transition-all duration-500 hover:shadow-xl hover:shadow-wedding-navy/5 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
                        <div className="w-10 h-10 bg-wedding-navy rounded-full flex items-center justify-center mr-3 group-hover:bg-wedding-navy/90 transition-all duration-300 shadow-lg group-hover:scale-110">
                            <HeartHandshake className="h-5 w-5 text-wedding-gold" />
                        </div>
                        <span className="font-serif text-2xl font-bold text-wedding-navy tracking-luxury flex items-baseline gap-2">
                            Binyan Adei Ad
                            <span className="text-[10px] font-sans font-bold text-wedding-gold/60 uppercase tracking-widest">by Torat Yaacov</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button onClick={() => onNavigate('shadchans')} className={`hidden md:block text-xs font-bold tracking-widest uppercase transition-colors ${currentView === 'shadchans' ? 'text-wedding-gold' : 'text-wedding-navy/60 hover:text-wedding-navy'}`}>Nos Shadchanim</button>

                        <div className="h-4 w-px bg-wedding-navy/10 mx-2"></div>

                        <button
                            onClick={() => onNavigate('dashboard')}
                            className={`text-xs font-bold tracking-widest uppercase transition-colors ${currentView === 'dashboard' ? 'text-wedding-navy underline underline-offset-8 decoration-wedding-gold decoration-2' : 'text-wedding-navy/60 hover:text-wedding-navy'}`}
                        >
                            Shadchan
                        </button>
                        <button
                            onClick={() => onNavigate('candidate-login')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${currentView === 'candidate-login' ? 'bg-wedding-navy text-wedding-gold shadow-xl' : 'bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy hover:text-white border border-wedding-navy/10'}`}
                        >
                            Mon Profil
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
