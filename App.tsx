import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Home, LogIn } from 'lucide-react';
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
      setProfiles([...profiles, createdProfile]);
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

        {/* Floating Decorative Elements - Text-Free Atmosphere */}
        <div className="fixed -top-10 -left-10 w-80 h-80 z-[-1] opacity-40 pointer-events-none animate-pulse duration-[4000ms]">
          <img src="https://www.svgrepo.com/show/486246/flower-1.svg" className="w-full h-full rotate-12" alt="" />
        </div>
        <div className="fixed -bottom-20 -right-20 w-96 h-96 z-[-1] opacity-30 pointer-events-none">
          <img src="https://www.svgrepo.com/show/486237/flower-bouquet.svg" className="w-full h-full -rotate-12" alt="" />
        </div>

        {/* Small Floating Ring Accents */}
        <div className="fixed top-1/4 -right-10 w-40 h-40 z-[-1] opacity-10 pointer-events-none animate-float">
          <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=300&q=80" className="w-full h-full rounded-full object-cover" alt="" />
        </div>


        {/* Floating Rings - Symmetric Top Right */}
        <img
          src="https://images.unsplash.com/photo-1596671049182-4e9008987151?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
          alt="Wedding Bouquet"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"; // Fallback to Rings if broken
            e.currentTarget.alt = "Wedding Rings Fallback";
          }}
          className="fixed top-24 right-10 w-32 h-32 object-cover rounded-full shadow-2xl z-[-1] opacity-60 border-4 border-white hidden md:block animate-fade-in"
        />

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
                  <div className="max-w-4xl mx-auto px-4 min-h-[calc(100vh-80px)] flex flex-col justify-center py-8">
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] px-4"
                >
                  <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Inscription Reçue !</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                      Mazel Tov ! Votre profil a bien été enregistré.
                      <br />
                      Notre équipe de Shadchanim va l'examiner avec la plus grande attention.
                      <br /><br />
                      Vous pouvez dès maintenant accéder à votre compte.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button
                        onClick={() => setView('candidate-login')}
                        className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" /> Se connecter
                      </button>
                      <button
                        onClick={() => setView('home')}
                        className="flex-1 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Home className="w-5 h-5" /> Accueil
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