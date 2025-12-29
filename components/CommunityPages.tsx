import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Users, Heart, Share2, Mail, Phone } from 'lucide-react';
import { api } from '../services/dataService';

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        api.getEvents().then(setEvents).catch(console.error);
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-8 flex items-center gap-3">
                <Calendar className="w-10 h-10 text-indigo-600" />
                Événements
            </h1>
            {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                    <p className="text-slate-500">Aucun événement prévu pour le moment.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xl flex-col">
                                <span>{new Date(event.date).getDate()}</span>
                                <span className="text-sm uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                                <p className="text-slate-600 mb-4">{event.description}</p>
                                <div className="text-sm text-slate-500 mb-4"><span className="font-bold">Lieu:</span> {event.location}</div>
                                <button className="text-indigo-600 font-medium hover:underline">S'inscrire →</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        api.getPosts().then(setPosts).catch(console.error);
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-8 flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-amber-500" />
                Blog & Halacha
            </h1>
            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                    <p className="text-slate-500">Aucun article publié.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                            <div className="h-48 bg-slate-200" style={{ backgroundImage: `url(${post.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                            <div className="p-6">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Article</span>
                                <h3 className="text-xl font-bold text-slate-800 mt-2 mb-3">{post.title}</h3>
                                <p className="text-slate-500 text-sm mb-4">{post.excerpt}</p>
                                <button className="text-slate-900 font-medium text-sm hover:underline">Lire l'article</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ShadchansPage: React.FC = () => {
    const [shadchans, setShadchans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getShadchans()
            .then((data) => {
                setShadchans(data || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 min-h-[60vh]">
            <h1 className="text-4xl font-serif font-bold text-wedding-navy mb-6 flex items-center justify-center gap-3">
                <Users className="w-10 h-10 text-wedding-gold" />
                Nos Shadchanim
            </h1>

            <p className="text-center text-wedding-navy/60 max-w-2xl mx-auto mb-16 font-medium text-lg">
                Nos Shadchanim sont des bénévoles dévoués de la communauté, sélectionnés pour leur expérience, leur sagesse et leur discrétion.
            </p>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : shadchans.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-wedding-navy/10 shadow-xl text-center max-w-2xl mx-auto backdrop-blur-sm bg-white/60">
                    <p className="text-xl text-wedding-navy mb-6 font-serif italic">
                        "Celui qui forme un couple est considéré comme s'il avait reconstruit une ruine de Jérusalem."
                    </p>
                    <p className="text-wedding-navy/60">
                        Notre équipe s'agrandit. Pour rejoindre l'équipe ou contacter un responsable, veuillez nous écrire directement.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {shadchans.map(shadchan => (
                        <div key={shadchan.id || Math.random()} className="bg-white rounded-3xl overflow-hidden border border-wedding-navy/5 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative">
                            <div className="h-32 bg-wedding-navy relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                    <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-xl">
                                        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                                            <span className="text-2xl font-serif font-bold text-wedding-navy">
                                                {shadchan.name ? shadchan.name.charAt(0) : 'S'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 pb-8 px-6 text-center">
                                <h3 className="text-2xl font-serif font-bold text-wedding-navy mb-1.5">{shadchan.name || 'Shadchan Anonyme'}</h3>
                                <p className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em] mb-6">{shadchan.role || 'Bénévole'}</p>

                                {shadchan.bio && (
                                    <p className="text-wedding-navy/60 text-sm mb-8 line-clamp-3 leading-relaxed px-2">
                                        {shadchan.bio}
                                    </p>
                                )}

                                <div className="flex justify-center gap-4">
                                    {shadchan.phone && (
                                        <a href={`tel:${shadchan.phone}`} className="p-3 rounded-2xl bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg hover:shadow-wedding-navy/20">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    )}
                                    {shadchan.email && (
                                        <a href={`mailto:${shadchan.email}`} className="p-3 rounded-2xl bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy hover:text-white transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg hover:shadow-wedding-navy/20">
                                            <Mail className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const DonationPage: React.FC = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">Soutenez Lev Echad</h1>
        <p className="text-lg text-slate-600 mb-8">
            Lev Echad est une initiative communautaire à but non lucratif. Vos dons nous permettent de maintenir la plateforme et d'organiser des événements.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8">
            {['18€', '52€', '101€'].map(amount => (
                <button key={amount} className="py-4 border-2 border-slate-200 rounded-xl font-bold text-xl text-slate-600 hover:border-indigo-500 hover:text-indigo-500 transition-colors">
                    {amount}
                </button>
            ))}
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg transition-colors">
            Faire un don sécurisé
        </button>
    </div>
);
