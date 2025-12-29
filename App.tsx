import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Home, LogIn, Heart } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import ShadchanDashboard from './components/ShadchanDashboard';
import LoginPage from './components/LoginPage';
import CandidateLogin from './components/CandidateLogin';
import CandidatePortal from './components/CandidatePortal';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './components/ToastSystem';
import { ShadchansPage, DonationPage } from './components/CommunityPages';
import { Profile, Gender, ReligiousLevel } from './types';

import { api } from './services/dataService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'register' | 'dashboard' | 'shadchans' | 'donate' | 'candidate-login' | 'candidate-portal' | 'registration-success'>('home');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<Profile | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // New loading state
  // Dark mode removed
  const darkMode = false;
  const toggleDarkMode = () => { };

  // Load profiles from API
  useEffect(() => {
    const loadProfiles = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProfiles();
        setProfiles(data);
      } catch (error) {
        console.error("Failed to load profiles:", error);
        // Fallback to empty or show error
      } finally {
        setIsLoading(false);
      }
    };
    loadProfiles();
  }, []);

  const handleSaveProfile = async (newProfile: Profile) => {
    if (editingProfile) {
      try {
        const updated = await api.updateProfile(newProfile);
        setProfiles(profiles.map(p => p.id === updated.id ? updated : p));
        setEditingProfile(undefined);
        setView('home');
        alert("Votre profil a été mis à jour avec succès.");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Erreur lors de la mise à jour.");
      }
      return;
    }

    // Duplicate Detection (Client-side)
    const duplicate = profiles.find(p =>
      p.firstName.trim().toLowerCase() === newProfile.firstName.trim().toLowerCase() &&
      p.lastName.trim().toLowerCase() === newProfile.lastName.trim().toLowerCase()
    );

    if (duplicate) {
      const confirmAdd = window.confirm(`Un profil existe déjà au nom de ${newProfile.firstName} ${newProfile.lastName}. Voulez-vous quand même l'ajouter ?`);
      if (!confirmAdd) return;
    }

    try {
      const createdProfile = await api.createProfile(newProfile);
      setProfiles([...profiles, createdProfile]);
      setCurrentUser(createdProfile);
      setEditingProfile(createdProfile);
      setView('registration-success');
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Erreur lors de la création du profil.");
    }
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    try {
      const savedProfile = await api.updateProfile(updatedProfile);
      setProfiles(profiles.map(p => p.id === savedProfile.id ? savedProfile : p));

      // If current user is the one being updated, update local state
      if (currentUser?.id === savedProfile.id) {
        setCurrentUser(savedProfile);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleDeleteProfiles = async (idsToDelete: string[]) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${idsToDelete.length} profil(s) ?`)) return;

    try {
      await Promise.all(idsToDelete.map(id => api.deleteProfile(id)));
      setProfiles(profiles.filter(p => !idsToDelete.includes(p.id)));
    } catch (error) {
      console.error("Error deleting profiles:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  const handlePinSubmit = () => {
    if (pin === '1212') {
      setIsAuthenticated(true);
      setView('dashboard');
      // Optionally save session
    } else {
      alert("Code PIN incorrect");
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 relative">
        {/* Background Image - Chuppah & Flowers */}
        <div
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        {/* Elegant White Overlay with Gradient for Depth */}
        <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-white/95 via-white/85 to-wedding-rose/20 backdrop-blur-[1px]" />

        <div className="flex-grow flex flex-col text-wedding-navy">
          {view !== 'dashboard' && view !== 'candidate-portal' && view !== 'register' && view !== 'candidate-login' && (
            <Navbar currentView={view} onNavigate={setView} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          )}

          {/* Main Content */}
          <main className={`flex-grow overflow-x-hidden ${['home', 'shadchans'].includes(view) ? 'pt-20' : ''}`}>

            <AnimatePresence mode="wait">
              {view === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomePage onNavigate={setView} />
                </motion.div>
              )}

              {view === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-7xl mx-auto px-4 min-h-[calc(100vh-80px)] w-full flex flex-col justify-center py-8">
                    <RegistrationForm
                      onSave={handleSaveProfile}
                      onCancel={() => { setView('home'); setEditingProfile(undefined); }}
                      initialData={editingProfile}
                      onLoginClick={() => setView('candidate-login')}
                    />
                  </div>
                </motion.div>
              )}

              {view === 'registration-success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center min-h-[70vh] px-4"
                >
                  <div className="glass-card p-12 md:p-16 rounded-[2.5rem] border-wedding-gold/20 shadow-2xl flex flex-col items-center text-center max-w-xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                      <Heart className="w-40 h-40 text-wedding-gold" />
                    </div>

                    <div className="w-24 h-24 bg-wedding-navy rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative z-10 border border-wedding-gold/30">
                      <CheckCircle className="w-12 h-12 text-wedding-gold animate-pulse" />
                    </div>

                    <h2 className="text-4xl font-serif font-bold text-wedding-navy mb-6 tracking-tight relative z-10">
                      Inscription Reçue !
                    </h2>

                    <div className="w-20 h-0.5 bg-wedding-gold/30 mb-8 rounded-full"></div>

                    <p className="text-wedding-navy/70 mb-12 leading-relaxed font-medium text-lg relative z-10 italic">
                      Mazel Tov ! Votre profil a bien été enregistré avec succès.
                      <br /><br />
                      Notre équipe de Shadchanim va l'examiner avec la plus grande attention pour vous proposer les meilleures opportunités.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 w-full relative z-10">
                      <button
                        onClick={() => setView('candidate-portal')}
                        className="flex-1 bg-wedding-navy text-white px-8 py-4 rounded-2xl font-bold hover:bg-wedding-navy/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-wedding-navy/20 border border-wedding-gold/20 uppercase tracking-widest text-xs"
                      >
                        <LogIn className="w-5 h-5 text-wedding-gold" /> Accéder à mon espace
                      </button>
                      <button
                        onClick={() => setView('home')}
                        className="flex-1 bg-white/50 text-wedding-navy px-8 py-4 rounded-2xl font-bold hover:bg-white/80 transition-all flex items-center justify-center gap-3 border border-wedding-navy/10 uppercase tracking-widest text-xs"
                      >
                        <Home className="w-5 h-5 text-wedding-gold" /> Retour à l'accueil
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'candidate-login' && (
                <motion.div
                  key="candidate-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CandidateLogin
                    onLoginSuccess={(profile) => {
                      setEditingProfile(profile);
                      setCurrentUser(profile);
                      setView('candidate-portal');
                    }}
                    onCancel={() => setView('home')}
                  />
                </motion.div>
              )}

              {view === 'candidate-portal' && currentUser && (
                <motion.div
                  key="candidate-portal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CandidatePortal
                    candidate={currentUser}
                    onLogout={() => { setCurrentUser(undefined); setView('home'); }}
                    onUpdateProfile={handleUpdateProfile}
                  />
                </motion.div>
              )}

              {view === 'dashboard' && (
                !isAuthenticated ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoginPage
                      onLoginSuccess={() => {
                        setIsAuthenticated(true);
                        setView('dashboard');
                      }}
                      onCancel={() => setView('home')}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="fixed inset-0 z-50 bg-slate-50">
                      <ShadchanDashboard
                        profiles={profiles}
                        onUpdateProfile={handleUpdateProfile}
                        onDeleteProfiles={handleDeleteProfiles}
                      />
                    </div>
                  </motion.div>
                )
              )}


              {view === 'shadchans' && (
                <motion.div key="shadchans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <ShadchansPage />
                </motion.div>
              )}

            </AnimatePresence>

          </main>


        </div>
      </div>
    </ToastProvider>
  );
};

export default App;