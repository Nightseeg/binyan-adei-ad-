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
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-wedding-navy rounded-full flex items-center justify-center mr-2 md:mr-3 group-hover:bg-wedding-navy/90 transition-all duration-300 shadow-lg group-hover:scale-110">
                            <HeartHandshake className="h-4 w-4 md:h-5 md:w-5 text-wedding-gold" />
                        </div>
                        <span className="font-serif text-lg md:text-2xl font-bold text-wedding-navy tracking-tight md:tracking-luxury flex flex-col md:flex-row md:items-baseline md:gap-2">
                            Binyan Adei Ad
                            <span className="text-[8px] md:text-[10px] font-sans font-bold text-wedding-gold/60 uppercase tracking-widest leading-none md:leading-normal">by Torat Yaacov</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-6">
                        <button onClick={() => onNavigate('shadchans')} className="hidden lg:block text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors text-wedding-navy/60 hover:text-wedding-navy">Nos Shadchanim</button>

                        <div className="hidden sm:block h-4 w-px bg-wedding-navy/10 mx-1 md:mx-2"></div>

                        <button
                            onClick={() => onNavigate('dashboard')}
                            className={`text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors ${currentView === 'dashboard' ? 'text-wedding-navy underline underline-offset-8 decoration-wedding-gold decoration-2' : 'text-wedding-navy/60 hover:text-wedding-navy'}`}
                        >
                            Shadchan
                        </button>
                        <button
                            onClick={() => onNavigate('candidate-login')}
                            className={`px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all duration-300 ${currentView === 'candidate-login' ? 'bg-wedding-navy text-wedding-gold shadow-xl' : 'bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy hover:text-white border border-wedding-navy/10'}`}
                        >
                            <span className="md:hidden">Profil</span>
                            <span className="hidden md:inline">Mon Profil</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
