import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Users, Heart, Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { api } from '../services/dataService';

/* =========================
   EVENTS PAGE
========================= */

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        api.getEvents().then(setEvents).catch(console.error);
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-serif font-bold text-wedding-navy tracking-tight mb-4 flex items-center justify-center gap-4">
                    <Calendar className="w-10 h-10 text-wedding-gold" />
                    Événements
                </h1>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-20">
                    <p>Aucun événement prévu.</p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {events.map(event => (
                        <div key={event.id} className="p-8 border rounded-2xl flex gap-6">
                            <div>
                                <div>{new Date(event.date).getDate()}</div>
                                <div>{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                            </div>
                            <div className="flex-1">
                                <h3>{event.title}</h3>
                                <p>{event.description}</p>
                                <div className="flex gap-4 text-sm">
                                    <span><MapPin className="inline w-4 h-4" /> {event.location}</span>
                                    <span><Clock className="inline w-4 h-4" /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* =========================
   BLOG PAGE
========================= */

export const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        api.getPosts().then(setPosts).catch(console.error);
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            <h1 className="text-4xl font-bold mb-12 flex justify-center gap-3">
                <BookOpen className="w-8 h-8" /> Blog & Halacha
            </h1>

            {posts.length === 0 ? (
                <p className="text-center">Aucun article.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <div key={post.id} className="border rounded-2xl overflow-hidden">
                            <div
                                className="h-48 bg-cover bg-center"
                                style={{ backgroundImage: `url(${post.image_url})` }}
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                                <p className="text-sm mb-4">{post.excerpt}</p>
                                <button className="flex items-center gap-2 text-sm font-bold">
                                    Lire la suite <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* =========================
   SHADCHANS PAGE (FIXED)
========================= */

export const ShadchansPage: React.FC = () => {
    const [shadchans, setShadchans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getShadchans()
            .then(data => setShadchans(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 min-h-[60vh]">
            <h1 className="text-4xl font-bold mb-12 flex justify-center gap-3">
                <Users className="w-8 h-8" />
                Nos Shadchanim
            </h1>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : shadchans.length === 0 ? (
                <p className="text-center">Aucun shadchan disponible.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {shadchans.map(shadchan => (
                        <div key={shadchan.id} className="group relative bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col h-full hover:-translate-y-1">
                            {/* Header Gradient */}
                            <div className="h-24 bg-wedding-navy relative">
                                <div className="absolute inset-0 bg-white/5 opacity-30"></div>
                            </div>

                            {/* Avatar */}
                            <div className="relative -mt-12 px-6 flex justify-center">
                                {shadchan.image_url ? (
                                    <img
                                        src={shadchan.image_url}
                                        alt={shadchan.name}
                                        className="w-24 h-24 rounded-full object-cover border-[4px] border-white shadow-md bg-white"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border-[4px] border-white shadow-md bg-slate-50 flex items-center justify-center">
                                        <span className="text-3xl font-serif font-bold text-wedding-navy">
                                            {shadchan.name?.charAt(0) || 'S'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-6 pt-4 text-center flex-1 flex flex-col">
                                <h3 className="text-2xl font-serif font-bold text-wedding-navy mb-1 group-hover:text-wedding-gold transition-colors">
                                    {shadchan.name}
                                </h3>

                                <div className="w-12 h-1 bg-wedding-gold/30 mx-auto rounded-full my-3"></div>

                                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium line-clamp-4">
                                    {shadchan.bio || "Contactez ce Shadchan pour plus d'informations."}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center gap-4 mt-auto">
                                    {shadchan.phone && (
                                        <a
                                            href={`tel:${shadchan.phone}`}
                                            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-wedding-navy hover:bg-wedding-navy hover:text-white hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100"
                                            title="Appeler"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </a>
                                    )}
                                    {shadchan.email && (
                                        <a
                                            href={`mailto:${shadchan.email}`}
                                            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-wedding-navy hover:bg-wedding-navy hover:text-white hover:scale-110 transition-all duration-300 shadow-sm border border-slate-100"
                                            title="Email"
                                        >
                                            <Mail className="w-5 h-5" />
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


