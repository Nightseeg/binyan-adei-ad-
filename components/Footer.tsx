import React from 'react';
import { HeartHandshake } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-slate-100 py-12 bg-white mt-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <HeartHandshake className="w-5 h-5 text-indigo-500" />
                            <span className="font-serif text-slate-800 text-lg font-bold">Binyan Adei Ad</span>
                        </div>
                        <p className="text-slate-500 mb-6">Plateforme communautaire dédiée aux mariages juifs authentiques.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Votre email" className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm w-full" />
                            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">S'inscrire</button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Inscrivez-vous à notre newsletter.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-4">Aide</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><button onClick={() => alert("FAQ: Coming Soon")} className="hover:text-indigo-600">Centre d'aide</button></li>
                            <li><button onClick={() => alert("Feedback: lev.echad@gmail.com")} className="hover:text-indigo-600">Donner votre avis</button></li>
                            <li><button onClick={() => alert("Contact: support@levechad.org")} className="hover:text-indigo-600">Contact</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-4">Légal</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><button onClick={() => alert("CGU...")} className="hover:text-indigo-600">CGU</button></li>
                            <li><button onClick={() => alert("Confidentialité...")} className="hover:text-indigo-600">Confidentialité</button></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-8 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} Binyan Adei Ad. Une initiative communautaire.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
