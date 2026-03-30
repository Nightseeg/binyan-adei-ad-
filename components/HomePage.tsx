import React, { useState, useEffect } from 'react';
import { ArrowRight, LogIn, Quote, Users, Target, Heart, CheckCircle2, Phone, Mail, MapPin, User, ShieldCheck, Stars } from 'lucide-react';
import { api } from '../services/dataService';

interface HomePageProps {
    onNavigate: (view: 'register' | 'dashboard' | 'candidate-login') => void;
}

const FadeInImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            decoding="async"
            className={`${className} transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-90' : 'opacity-0'}`}
        />
    );
};

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const [shadchansList, setShadchansList] = useState<any[]>([]);
    const [userCount, setUserCount] = useState(0);
    const targetCount = 60;

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
        // Animation du compteur
        let start = 0;
        const duration = 2000;
        const increment = targetCount / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= targetCount) {
                clearInterval(timer);
                setUserCount(targetCount);
            } else {
                setUserCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [targetCount]);

    return (
        <div className="w-full flex flex-col items-center bg-transparent font-sans text-wedding-navy selection:bg-wedding-rose/30 py-20 relative overflow-hidden">


            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-48 h-48 md:w-80 md:h-80 pointer-events-none">
                <FadeInImage
                    src="/assets/images/flower-corner-top-left.png"
                    alt="Decorative Flowers"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Top Right - using same image rotated if needed, or just let the top left separate */}
            {/* Plan called for bottom right specific. For top right I didn't generate one specific, 
                but I can rotate the top-left one or leave it asymmetric. 
                Original design had corners on top left and top right.
                Let's use Top-Left rotated for Top-Right? 
                Actually, usually corner flowers are asymmetric. 
                I generated top-left and bottom-right.
                I will put top-left on top-left.
                I will put bottom-right on bottom-right.
                What about top-right? I can flip the top-left one horizontally.
            */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-80 md:h-80 pointer-events-none">
                <FadeInImage
                    src="/assets/images/flower-corner-top-left.png"
                    alt="Decorative Flowers"
                    className="w-full h-full object-contain -scale-x-100"
                />
            </div>

            <div className="w-full max-w-4xl mx-auto px-6 text-center animate-fade-in relative z-10 mb-32">

                {/* Decorative Script Element */}
                <div className="font-serif italic text-3xl md:text-4xl text-wedding-gold mb-4 opacity-90" style={{ fontFamily: 'Playfair Display, serif' }}>
                    B'Siyata Dishmaya
                </div>

                {/* Main Logo */}
                <div className="flex justify-center items-center w-full mb-8 pt-12 md:pt-0">
                    <img 
                        src="/logo-transparent.png" 
                        alt="Binian Adei Ad Logo" 
                        className="w-[280px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-auto object-contain"
                    />
                </div>

                {/* Subtitle with lines */}
                <div className="flex items-center justify-center gap-2 md:gap-4 mb-12 md:mb-16">
                    <div className="hidden xs:block h-px bg-wedding-gold w-8 md:w-16 opacity-60"></div>
                    <p className="text-base sm:text-xl md:text-2xl text-wedding-text font-medium tracking-wide px-2 max-w-3xl mx-auto leading-relaxed">
                        Le mariage constitue l’une des étapes les plus déterminantes dans la vie d’une personne.
                        Selon la Torah, il représente la construction d’un foyer fondé sur la kedoucha, la stabilité et la responsabilité mutuelle.
                    </p>
                    <div className="hidden xs:block h-px bg-wedding-gold w-8 md:w-16 opacity-60"></div>
                </div>

                <div className="bg-wedding-navy/5 border border-wedding-gold/20 rounded-3xl px-8 py-8 md:px-12 md:py-10 mb-12 max-w-4xl mx-auto shadow-lg">
                    <p className="text-xl md:text-2xl text-wedding-navy font-serif italic leading-relaxed font-bold">
                        "Notre force : bien plus qu'un chiddoukh — un accompagnement sérieux, discret et structuré à chaque étape, encadré par des Rabbanim et des Avrechim reconnus pour leur qualité."
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <button
                        onClick={() => onNavigate('register')}
                        className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-wedding-navy text-white text-base md:text-lg font-bold rounded-full hover:bg-opacity-90 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-wedding-navy"
                    >
                        Créer mon Profil
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        onClick={() => onNavigate('candidate-login')}
                        className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-white/80 backdrop-blur-sm text-wedding-navy border border-wedding-navy/20 text-base md:text-lg font-bold rounded-full hover:bg-white hover:border-wedding-gold transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-xl"
                    >
                        <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                        Mon Compte
                    </button>
                </div>

                {/* Trust Badge */}
                <div className="mt-16 text-sm text-wedding-text/60 font-medium tracking-wide">
                    CONFIDENTIALITÉ ABSOLUE • ACCOMPAGNEMENT PERSONNALISÉ
                </div>
            </div>

            {/* Compteur d'inscrits */}
            <section className="w-full bg-wedding-navy text-white py-16 text-center transform -skew-y-1 my-12 shadow-2xl z-20">
                <div className="transform skew-y-1 max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-12">
                    <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-wedding-gold mb-4" />
                        <div className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white mb-2">
                            +{userCount}
                        </div>
                        <p className="text-sm md:text-base font-bold uppercase tracking-[0.2em] text-wedding-gold">Candidats inscrits</p>
                    </div>
                </div>
            </section>

            {/* Notre Objectif & Comment ça se passe */}
            <section id="objectif" className="w-full max-w-6xl mx-auto px-6 py-24 animate-fade-in relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-serif font-bold text-wedding-navy tracking-tight mb-4">
                        Notre Objectif
                    </h2>
                    <div className="w-24 h-px bg-wedding-gold/30 mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-wedding-navy/5 rounded-2xl flex items-center justify-center border border-wedding-navy/10 mb-8">
                            <Target className="w-8 h-8 text-wedding-gold" />
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-wedding-navy">Un accompagnement structuré et responsable</h3>
                        <p className="text-xl text-wedding-navy/70 leading-relaxed">
                            Notre objectif est d’aider chaque personne à trouver une proposition adaptée à sa personnalité, à son parcours et à ses aspirations.
                        </p>
                        <p className="text-lg text-wedding-navy/70 leading-relaxed">
                            Nous sommes convaincus que la réussite d’un shidoukh ne repose pas uniquement sur la rencontre, mais sur la qualité du processus, l’analyse des profils et l’encadrement tout au long du cheminement.
                        </p>
                        <ul className="space-y-4 pt-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-wedding-gold shrink-0" />
                                <span className="text-wedding-navy/80 font-medium text-sm">Chaque dossier est étudié avec attention afin de proposer des orientations cohérentes.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-wedding-gold shrink-0" />
                                <span className="text-wedding-navy/80 font-medium text-sm">Analyse approfondie des profils pour des suggestions sérieuses et réfléchies.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl relative z-10">
                            <img src="/assets/images/houppa.png" alt="Houppa religieuse" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute top-1/2 -right-8 w-32 h-32 bg-wedding-gold/20 rounded-full blur-3xl z-0"></div>
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-wedding-navy/10 rounded-full blur-3xl z-0"></div>
                    </div>
                </div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-bold text-wedding-navy tracking-tight mb-4">
                        Comment ça se passe ?
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-wedding-gold/10 hover:shadow-lg transition-all duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-wedding-navy/10 shadow-xl mb-6 text-xl font-serif font-bold text-wedding-gold">
                            1
                        </div>
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-3">Inscription</h4>
                        <p className="text-wedding-navy/60 font-medium text-base leading-relaxed">Vous complétez votre profil avec les informations nécessaires pour permettre une compréhension précise de vos attentes.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-wedding-gold/10 hover:shadow-lg transition-all duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-wedding-navy/10 shadow-xl mb-6 text-xl font-serif font-bold text-wedding-gold">
                            2
                        </div>
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-3">Analyse personnalisée</h4>
                        <p className="text-wedding-navy/60 font-medium text-base leading-relaxed">Notre équipe étudie votre profil de manière confidentielle afin d’identifier des propositions pertinentes.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-wedding-gold/10 hover:shadow-lg transition-all duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-wedding-navy/10 shadow-xl mb-6 text-xl font-serif font-bold text-wedding-gold">
                            3
                        </div>
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-3">Propositions adaptées</h4>
                        <p className="text-wedding-navy/60 font-medium text-base leading-relaxed">Des Chadhanims vous contactent avec des suggestions correspondant réellement à votre profil.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white/40 rounded-3xl border border-wedding-gold/10 hover:shadow-lg transition-all duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-wedding-navy/10 shadow-xl mb-6 text-xl font-serif font-bold text-wedding-gold">
                            4
                        </div>
                        <h4 className="text-xl font-serif font-bold text-wedding-navy mb-3">Accompagnement continu</h4>
                        <p className="text-wedding-navy/60 font-medium text-base leading-relaxed">Nos rabbanims restent disponibles pour vous accompagner, répondre aux questions et faciliter les démarches.</p>
                    </div>
                </div>
            </section>

            {/* Un accompagnement par des Rabbanim Section */}
            <section className="w-full max-w-5xl mx-auto px-6 py-24 animate-fade-in border-t border-wedding-gold/10 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-serif font-bold text-wedding-navy tracking-tight mb-4">
                        Accompagnement Rabbanim
                    </h2>
                    <p className="text-wedding-gold font-serif italic text-xl">Le soutien spirituel de Torah</p>
                    <div className="w-24 h-px bg-wedding-gold/30 mx-auto mt-6"></div>
                </div>

                <div className="glass-card p-12 md:p-16 rounded-[4rem] border-wedding-gold/10 shadow-2xl relative overflow-hidden mb-16">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-xl text-wedding-navy/80 leading-relaxed mb-8">
                                Parce que les décisions liées au mariage sont importantes, nous avons mis en place une ligne téléphonique permettant de consulter des Rabbanim expérimentés.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-wedding-gold/10">
                                    <Stars className="w-5 h-5 text-wedding-gold" />
                                    <span className="text-sm font-medium">Conseils avisés</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-wedding-gold/10">
                                    <Stars className="w-5 h-5 text-wedding-gold" />
                                    <span className="text-sm font-medium">Orientation adaptée</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-wedding-gold/10">
                                    <Stars className="w-5 h-5 text-wedding-gold" />
                                    <span className="text-sm font-medium">Regard de Torah</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-wedding-gold/10">
                                    <Stars className="w-5 h-5 text-wedding-gold" />
                                    <span className="text-sm font-medium">Aide à la décision</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center p-8 bg-wedding-navy rounded-[3rem] text-white">
                            <p className="text-xl font-serif italic mb-4">"Être guidé par des personnes de Torah apporte clarté, recul et sérénité dans le processus."</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-bold text-wedding-navy mb-2">Nos Engagements</h2>
                    <div className="w-16 h-px bg-wedding-gold/30 mx-auto mb-10"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        "Cadre sérieux et strictement confidentiel",
                        "Propositions adaptées et réfléchies",
                        "Accompagnement humain et professionnel",
                        "Accès à des conseils de Rabbanim",
                        "Valeurs fondées sur la Torah",
                        "Discrétion et professionnalisme"
                    ].map((engagement, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-5 bg-white/40 rounded-2xl border border-wedding-navy/5 shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-wedding-gold shrink-0" />
                            <span className="text-sm font-semibold text-wedding-navy/80">{engagement}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <div className="inline-block p-10 bg-white/60 backdrop-blur-md rounded-[3rem] border border-wedding-gold/20 shadow-xl max-w-2xl">
                        <h3 className="text-3xl font-serif font-bold text-wedding-navy mb-4">Notre Souhait</h3>
                        <p className="text-xl md:text-2xl text-wedding-navy/70 italic leading-relaxed">
                            Notre ambition est de permettre à chacun d’avancer vers le mariage avec confiance, sérénité et accompagnement, בעזרת ה׳, jusqu’à la construction d’un foyer fidèle à la Torah.
                        </p>
                        <p className="mt-6 font-bold text-wedding-gold uppercase tracking-widest text-sm">Nous vous souhaitons beaucoup de réussite</p>
                    </div>
                </div>
            </section>

            {/* Haskama (Approbation) Section */}
            <section className="w-full max-w-6xl mx-auto px-6 py-12 md:py-24 animate-fade-in relative z-10">
                <div className="relative p-10 md:p-16 bg-white/80 backdrop-blur-md rounded-[3rem] border border-wedding-gold/30 shadow-2xl text-center">
                    <Quote className="absolute top-8 left-8 w-12 h-12 text-wedding-gold/20 rotate-180 hidden sm:block" />
                    <Quote className="absolute bottom-8 right-8 w-12 h-12 text-wedding-gold/20 hidden sm:block" />
                    
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-wedding-navy mb-2 relative z-10">
                        הסכמה — Approbation
                    </h2>
                    <h3 className="text-xl md:text-2xl font-serif italic text-wedding-gold mb-12 relative z-10">
                        מורנו הגאון רב ישעיה ארוואץ שליט"א — Morenou Hagaon Rav Yechaya Arrouas Shlita
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10">
                        {/* Hebrew - Right side */}
                        <div className="space-y-6 text-base md:text-lg text-wedding-navy/85 leading-relaxed text-justify px-2 md:px-4 italic md:order-2" dir="rtl">
                            <p>
                                הנני בזאת לחזק ולהמליץ על הארגון הנפלא ׳בנין עדי עד׳ המורכב מת״ח בני סמכא בעלי השקפה טהורה וברורה, המלווים באופן מקצועי משודכים מרישא ועד גמירא בשעטו״מ, בעצה ובתבונה, במסירות גדולה לכל אחד, וכן מנשות חינוך עם נסיון רב בתחום, המלוות בנות בית יעקב על דרך הנ״ל, ודבר זה הוא ענין נחוץ מאוד בתקופתינו, ואיישר חילם כי הם עוסקים בענין זה לשם שמים, לחזק קדושת בתי ישראל.
                            </p>
                            <p>
                                ויה״ר שהשי״ת יהיה בעזרם ויזכו לסייעתא דשמיא גדולה להרחבת ולחיזוק קדושת בתי ישראל.
                            </p>
                            <p className="font-bold pt-4">ובזה באתי על החתום — ישעיה משה ארוואץ</p>
                        </div>

                        {/* Separator on desktop */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-wedding-gold/20"></div>

                        {/* French - Left side */}
                        <div className="space-y-6 text-base md:text-lg text-wedding-navy/85 leading-relaxed text-justify px-2 md:px-4 italic md:order-1 border-t md:border-t-0 border-wedding-gold/20 pt-8 md:pt-0">
                            <p>
                                Je viens par la présente renforcer et recommander chaleureusement la remarquable organisation Binyan Adé Ad, composée de talmidei 'hakhamim reconnus, possédant une approche pure et claire. Ils accompagnent de manière professionnelle les personnes engagées dans un chidoukh, du début jusqu'à la conclusion, avec l'aide d'Hachem, en apportant conseils et discernement, avec un grand dévouement pour chacun.
                            </p>
                            <p>
                                De même, des femmes issues du monde de l'éducation, dotées d'une grande expérience dans ce domaine, accompagnent les jeunes filles de Beth Yaakov selon la même approche. Cette action constitue aujourd'hui un besoin très important à notre époque. Je les félicite et les encourage, car ils s'investissent dans cette mission Léchem Chamaïm, afin de renforcer la Kedoucha des foyers d'Israël.
                            </p>
                            <p>
                                Que la volonté d'Hachem soit qu'Il les assiste et qu'ils méritent une grande aide du Ciel pour développer et renforcer la Kedoucha des foyers d'Israël.
                            </p>
                            <p className="font-bold not-italic pt-4">Et par la présente, je signe : Yechaya Moché Arrouas</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nous Contacter Section */}
            <section id="contact" className="w-full max-w-5xl mx-auto px-6 py-24 animate-fade-in border-t border-wedding-gold/10 relative z-10">
                <div className="bg-wedding-navy rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight mb-4 relative z-10">
                        Nous Contacter
                    </h2>
                    <p className="text-wedding-gold font-serif italic text-xl mb-12 relative z-10">Nous sommes là pour répondre à vos questions</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-3xl mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group text-left">
                            <Phone className="w-8 h-8 text-wedding-gold mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-white font-bold mb-1">Téléphone</h4>
                            <p className="text-white/60 text-sm">01 23 45 67 89</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group text-left">
                            <Mail className="w-8 h-8 text-wedding-gold mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-white font-bold mb-1">Email</h4>
                            <p className="text-white/60 text-sm">binadeiad@gmail.com</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group text-left">
                            <MapPin className="w-8 h-8 text-wedding-gold mb-4 group-hover:scale-110 transition-transform" />
                            <h4 className="text-white font-bold mb-1">Bureaux</h4>
                            <p className="text-white/60 text-sm">Jérusalem, Israel</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Corner Decorations */}
            <div className="absolute bottom-0 left-0 w-48 h-48 md:w-80 md:h-80 pointer-events-none">
                <FadeInImage
                    src="/assets/images/flower-corner-bottom-right.png"
                    alt="Decorative Flowers"
                    className="w-full h-full object-contain -scale-x-100"
                />
            </div>
            <div className="absolute bottom-0 right-0 w-48 h-48 md:w-80 md:h-80 pointer-events-none mix-blend-multiply">
                <FadeInImage
                    src="/assets/images/flower-corner-bottom-right.png"
                    alt="Decorative Flowers"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
};

export default HomePage;

