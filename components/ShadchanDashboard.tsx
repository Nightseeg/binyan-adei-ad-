import React, { useState, useEffect } from 'react';
import { Profile, Gender, MatchSuggestion, ReligiousLevel, Match, MatchStatus, Task, MatchingCriteria } from '../types';
import { findMatchesForProfile } from '../services/matchingEngine';
import { Users, Sparkles, Loader2, Phone, Search, MapPin, Briefcase, Ruler, Heart, X, ArrowUpDown, Kanban, LayoutGrid, Star, Save, Plus, Tag, CheckSquare, FileText, Check, Trash2, Copy, Printer, Activity, Bell, Clock, Square, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Upload, Zap, Mail, MessageCircle, Send, Settings } from 'lucide-react';
import MatchPipeline from './MatchPipeline';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/dataService';
import { useToast } from './ToastSystem';
import { Skeleton } from './Skeleton';
import { Confetti } from './Confetti';

interface ShadchanDashboardProps {
  profiles: Profile[];
  onUpdateProfile?: (profile: Profile) => void;
  onDeleteProfiles?: (ids: string[]) => void;
}

interface ActivityLog {
  id: string;
  type: 'MATCH_NEW' | 'MATCH_STATUS' | 'PROFILE_NEW' | 'NOTE_ADDED' | 'EXPORT_DATA';
  description: string;
  timestamp: number;
}

type SortOption = 'newest' | 'oldest' | 'age_asc' | 'age_desc' | 'name_asc' | 'name_desc';
type DashboardView = 'overview' | 'profiles' | 'pipeline' | 'tasks' | 'settings' | 'messages';

const ShadchanDashboard: React.FC<ShadchanDashboardProps> = ({ profiles, onUpdateProfile, onDeleteProfiles }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.MALE);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[] | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState<MatchingCriteria>({});
  const [showAdvancedMatch, setShowAdvancedMatch] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  // Messages State
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const count = await api.getUnreadMessagesCount();
      setUnreadCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentView === 'messages' && chatProfile) {
      loadMessages(chatProfile.id);
      api.markMessagesAsRead(chatProfile.id).then(() => fetchUnreadCount());
    }
  }, [currentView, chatProfile]);

  const loadMessages = async (pid: string) => {
    try {
      const msgs = await api.getMessages(pid);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatProfile || !newMessageText.trim()) return;
    try {
      await api.sendMessage({
        profileId: chatProfile.id,
        direction: 'FROM_SHADCHAN',
        content: newMessageText
      });
      setNewMessageText('');
      loadMessages(chatProfile.id);
    } catch (err) {
      console.error(err);
      showError("Échec de l'envoi");
    }
  };

  // Matches State
  const [matches, setMatches] = useState<Match[]>([]);

  // Advanced Filters State
  const [selectedReligiousLevel, setSelectedReligiousLevel] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Private Notes State (local buffer before save)
  const [noteBuffer, setNoteBuffer] = useState('');

  // Tagging State
  const [newTagInput, setNewTagInput] = useState('');

  // Interaction History State
  const [interactionType, setInteractionType] = useState('CALL');
  const [interactionNotes, setInteractionNotes] = useState('');

  // Documents State
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // Manual Match State
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [manualMatchBoyId, setManualMatchBoyId] = useState('');
  const [manualMatchGirlId, setManualMatchGirlId] = useState('');


  // Bulk Actions State
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  // Activity Feed State
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const logActivity = (type: ActivityLog['type'], description: string) => {
    const newActivity: ActivityLog = {
      id: uuidv4(),
      type,
      description,
      timestamp: Date.now()
    };
    // Optimistic Update
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
    // API Call
    api.logActivity(newActivity).catch(console.error);
  };

  // Task Manager State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [shadchanProfile, setShadchanProfile] = useState<any>({});
  const [shadchans, setShadchans] = useState<any[]>([]);

  // Templates Data
  // Content Modals State


  // Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, tasksData, activitiesData, shadchanData, allShadchans] = await Promise.all([
          api.getMatches(),
          api.getTasks(),
          api.getActivities(),
          api.getShadchanProfile(),
          api.getShadchans()
        ]);
        setMatches(matchesData);
        setTasks(tasksData);
        setShadchanProfile(shadchanData || { name: 'Votre Nom', bio: 'Biographie...' });
        setShadchans(allShadchans || []);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const publicUrl = await api.uploadFile('profiles', file);
      setShadchanProfile((prev: any) => ({ ...prev, image_url: publicUrl }));
      success("Image téléchargée");
    } catch (e) {
      console.error(e);
      showError("Erreur upload");
    } finally {
      setIsUploading(false);
    }
  };

  // Extract unique cities from profiles
  const uniqueCities = Array.from(new Set(profiles.map(p => p.city))).filter(Boolean).sort();
  // Extract unique tags
  const uniqueTags = Array.from(new Set(profiles.flatMap(p => p.tags || []))).filter(Boolean).sort();

  useEffect(() => {
    if (selectedProfile) {
      setNoteBuffer(selectedProfile.privateNotes || '');
    }
  }, [selectedProfile]);

  const filteredProfiles = profiles
    .filter(p => {
      const matchesGender = p.gender === selectedGender;
      const matchesSearch =
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contactPhone && p.contactPhone.includes(searchQuery)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesReligion = selectedReligiousLevel ? p.religiousLevel === selectedReligiousLevel : true;
      const matchesCity = selectedCity ? p.city === selectedCity : true;
      const matchesFavorite = showFavoritesOnly ? p.isFavorite : true;
      const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;

      return matchesGender && matchesSearch && matchesReligion && matchesCity && matchesFavorite && matchesTag;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'age_asc':
          return a.age - b.age;
        case 'age_desc':
          return b.age - a.age;
        case 'name_asc':
          return a.firstName.localeCompare(b.firstName);
        case 'name_desc':
          return b.firstName.localeCompare(a.firstName);
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        default:
          return 0;
      }
    });

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setSuggestions(null); // Reset previous suggestions
    setNoteBuffer(profile.privateNotes || '');
  };

  const handleViewMatch = (profile: Profile) => {
    // Switch gender tab if necessary so the profile is visible in sidebar context
    setSelectedGender(profile.gender);
    // Reset filters that might hide this profile
    setSearchQuery('');
    setSelectedReligiousLevel('');
    setSelectedCity('');
    handleProfileSelect(profile);
    setCurrentView('profiles');
  };

  const handleUpdateMatchStatus = async (matchId: string, newStatus: MatchStatus) => {
    const matchToUpdate = matches.find(m => m.id === matchId);
    if (!matchToUpdate) return;

    const updatedMatch = { ...matchToUpdate, status: newStatus, lastUpdated: Date.now() };

    setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m));

    try {
      await api.saveMatch(updatedMatch);
    } catch (e) { console.error(e); }

    if (newStatus === MatchStatus.ENGAGED) {
      setShowConfetti(true);
      success("Mazel Tov ! Match confirmé.");
    }
    // Log activity
    const match = matches.find(m => m.id === matchId);
    if (match) {
      logActivity('MATCH_STATUS', `Statut mis à jour pour le match ${match.boyId}/${match.girlId}: ${newStatus}`);
    }
  };

  const createMatchFromSuggestion = (candidateProfile: Profile, reasoning: string) => {
    if (!selectedProfile) return;

    // Determine who is who based on gender (convention: boyId, girlId)
    const boyId = selectedProfile.gender === Gender.MALE ? selectedProfile.id : candidateProfile.id;
    const girlId = selectedProfile.gender === Gender.FEMALE ? selectedProfile.id : candidateProfile.id;

    // Check if match already exists
    const exists = matches.some(m => (m.boyId === boyId && m.girlId === girlId));
    if (exists) {
      alert("Ce match existe déjà dans le pipeline.");
      return;
    }

    const newMatch: Match = {
      id: uuidv4(),
      boyId,
      girlId,
      status: MatchStatus.RESEARCHING,
      notes: `Suggestion IA: ${reasoning}`,
      lastUpdated: Date.now()
    };

    setMatches(prev => [...prev, newMatch]);
    api.saveMatch(newMatch).catch(console.error);
    logActivity('MATCH_NEW', `Nouveau match (IA) créé`);
    alert("Match ajouté au pipeline dans 'Recherche' !");
    setCurrentView('pipeline');
  };

  const toggleFavorite = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    if (onUpdateProfile) {
      onUpdateProfile({ ...profile, isFavorite: !profile.isFavorite });
      // If currently selected, update local state immediately for UI responsiveness
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile({ ...profile, isFavorite: !profile.isFavorite });
      }
    }
  };

  const handleAddTag = () => {
    if (!selectedProfile || !onUpdateProfile || !newTagInput.trim()) return;
    const currentTags = selectedProfile.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      const updated = { ...selectedProfile, tags: [...currentTags, newTagInput.trim()] };
      onUpdateProfile(updated);
      setSelectedProfile(updated);
    }
    setNewTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!selectedProfile || !onUpdateProfile) return;
    const currentTags = selectedProfile.tags || [];
    const updated = { ...selectedProfile, tags: currentTags.filter(t => t !== tag) };
    onUpdateProfile(updated);
    setSelectedProfile(updated);
  };

  const saveNotes = () => {
    if (selectedProfile && onUpdateProfile) {
      const updated = { ...selectedProfile, privateNotes: noteBuffer };
      onUpdateProfile(updated);
      setSelectedProfile(updated);
      success("Notes sauvegardées");
    }
  };

  const runAIMatchmaking = async () => {
    if (!selectedProfile) return;
    setSuggestions(null); // Clear previous suggestions immediately
    setIsAnalyzing(true);
    try {
      const response = await findMatchesForProfile(selectedProfile, profiles, matchCriteria);
      setSuggestions(response.suggestions);
    } catch (err) {
      showError("Erreur lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualMatchSubmit = () => {
    if (!manualMatchBoyId || !manualMatchGirlId) {
      alert("Veuillez sélectionner un homme et une femme.");
      return;
    }
    const exists = matches.some(m => (m.boyId === manualMatchBoyId && m.girlId === manualMatchGirlId));
    if (exists) {
      alert("Ce match existe déjà.");
      return;
    }
    const newMatch: Match = {
      id: uuidv4(),
      boyId: manualMatchBoyId,
      girlId: manualMatchGirlId,
      status: MatchStatus.RESEARCHING,
      notes: "Match créé manuellement",
      lastUpdated: Date.now()
    };
    setMatches(prev => [...prev, newMatch]);
    api.saveMatch(newMatch).catch(console.error);
    alert("Match créé avec succès !");
    setShowManualMatchModal(false);
    setManualMatchBoyId('');
    setManualMatchGirlId('');
    setCurrentView('pipeline');
  };

  // Bulk Actions Handlers
  const toggleProfileSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProfileIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (!onDeleteProfiles || selectedProfileIds.length === 0) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProfileIds.length} profils ?`)) {
      onDeleteProfiles(selectedProfileIds);
      logActivity('PROFILE_NEW', `${selectedProfileIds.length} profils supprimés`);
      setSelectedProfileIds([]);
      if (selectedProfile && selectedProfileIds.includes(selectedProfile.id)) {
        setSelectedProfile(null);
      }
    }
  };

  const selectAllFiltered = () => {
    if (selectedProfileIds.length === filteredProfiles.length) {
      setSelectedProfileIds([]);
    } else {
      setSelectedProfileIds(filteredProfiles.map(p => p.id));
    }
  };

  const handleAddDocument = () => {
    if (!selectedProfile || !onUpdateProfile || !newDocName || !newDocUrl) return;
    const newDoc = {
      id: uuidv4(),
      name: newDocName,
      url: newDocUrl,
      type: 'other',
      uploadedAt: Date.now()
    };
    const updatedProfile = {
      ...selectedProfile,
      documents: [...(selectedProfile.documents || []), newDoc]
    };
    setSelectedProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    logActivity('NOTE_ADDED', `Document ajouté pour ${selectedProfile.firstName}`);
    success('Document ajouté avec succès');
    setNewDocName('');
    setNewDocUrl('');
  };

  // Task Handlers
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: uuidv4(),
      text: newTaskText,
      completed: false,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
    api.createTask(newTask).catch(err => {
      console.error(err);
      alert("Erreur lors de la sauvegarde : " + (err.message || err));
    });
    setNewTaskText('');
  };

  const handleShadchanAssignment = (shadchanId: number) => {
    if (!selectedProfile || !onUpdateProfile) return;
    const updated = { ...selectedProfile, assignedShadchanId: shadchanId || undefined };
    onUpdateProfile(updated);
    setSelectedProfile(updated);
    success("Shadchan assigné avec succès");
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    const taskToUpdate = updatedTasks.find(t => t.id === id);
    if (taskToUpdate) {
      api.updateTask(taskToUpdate).catch(console.error);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    api.deleteTask(id).catch(console.error);
  };

  // Template Copy
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papier !");
  };

  const handleAddInteraction = () => {
    if (!selectedProfile || !onUpdateProfile || !interactionNotes.trim()) return;
    const newInteraction = {
      id: uuidv4(),
      date: Date.now(),
      type: interactionType as 'CALL' | 'MEETING' | 'EMAIL' | 'OTHER',
      notes: interactionNotes
    };
    const updated = {
      ...selectedProfile,
      interactionHistory: [...(selectedProfile.interactionHistory || []), newInteraction]
    };
    onUpdateProfile(updated);
    setSelectedProfile(updated);
    setInteractionNotes('');
    setInteractionType('CALL');
  };

  const getProfileById = (id: string) => profiles.find(p => p.id === id);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedReligiousLevel('');
    setSelectedCity('');
    setSortOption('newest');
    setShowFavoritesOnly(false);
  };

  const handlePrintProfile = () => {
    if (!selectedProfile) return;
    window.print();
  };

  const hasActiveFilters = searchQuery || selectedReligiousLevel || selectedCity || showFavoritesOnly;

  return (
    <div className="flex h-screen bg-transparent font-sans text-wedding-navy overflow-hidden print:h-auto print:block relative">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Sidebar Navigation */}
      <aside className="w-48 bg-wedding-navy flex flex-col shrink-0 z-30 print:hidden relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -right-24 w-48 h-48 bg-wedding-rose rounded-full blur-[80px]"></div>
        </div>

        {/* Logo Area */}
        <div className="p-8 flex flex-col items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-wedding-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-wedding-gold/20 transform hover:rotate-3 transition-transform duration-500 border border-white/10">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <div className="text-center">
            <span className="font-serif font-bold text-xl tracking-luxury text-white block">BINYAN ADEI AD</span>
            <span className="text-[9px] font-bold tracking-[0.3em] text-white/40 uppercase mt-1 block">Shidduch Connect</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-1.5 py-6">
          <p className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Principal</p>

          <button onClick={() => setCurrentView('overview')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'overview' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            <Activity className={`w-5 h-5 transition-colors ${currentView === 'overview' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            <span className="relative z-10">Vue d'ensemble</span>
            {currentView === 'overview' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => setCurrentView('profiles')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'profiles' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            <LayoutGrid className={`w-5 h-5 transition-colors ${currentView === 'profiles' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            <span className="relative z-10">Candidats</span>
            {currentView === 'profiles' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => setCurrentView('pipeline')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'pipeline' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            <Kanban className={`w-5 h-5 transition-colors ${currentView === 'pipeline' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            <span className="relative z-10">Pipeline</span>
            {currentView === 'pipeline' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <p className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 mt-8">Outils</p>

          <button onClick={() => setCurrentView('tasks')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'tasks' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            <CheckSquare className={`w-5 h-5 transition-colors ${currentView === 'tasks' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            <span className="relative z-10">Notes</span>
            {currentView === 'tasks' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => setCurrentView('messages')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'messages' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            <div className="relative">
              <MessageCircle className={`w-5 h-5 transition-colors ${currentView === 'messages' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
            </div>
            <span className="relative z-10 flex-1 flex items-center justify-between">
              Messagerie
              {unreadCount > 0 && <span className="bg-wedding-gold text-wedding-navy text-[9px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </span>
            {currentView === 'messages' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <div className="mt-auto">
            <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'settings' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <Settings className={`w-5 h-5 transition-colors ${currentView === 'settings' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
              <span className="relative z-10">Paramètres</span>
              {currentView === 'settings' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
            </button>
          </div>
        </nav>

        <div className="p-8 flex flex-col items-center gap-2 relative z-10 opacity-30">
          <div className="text-[9px] font-bold text-white uppercase tracking-[0.3em]">Binyan Adei Ad v2.1</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="glass-nav h-16 px-8 flex items-center justify-between shrink-0 shadow-xl shadow-wedding-navy/5 z-20 print:hidden mx-6 mt-4 rounded-2xl border border-white/50">
          <h2 className="font-serif font-bold text-2xl text-wedding-navy flex items-center gap-3">
            {currentView === 'overview' && <><Activity className="w-6 h-6 text-wedding-gold" /> Vue d'Ensemble</>}
            {currentView === 'profiles' && <><LayoutGrid className="w-6 h-6 text-wedding-gold" /> Base Candidats</>}
            {currentView === 'pipeline' && <><Kanban className="w-6 h-6 text-wedding-gold" /> Pipeline des Matchs</>}
            {currentView === 'tasks' && <><CheckSquare className="w-6 h-6 text-wedding-gold" /> Notes</>}
            {currentView === 'messages' && <><MessageCircle className="w-6 h-6 text-wedding-gold" /> Messagerie Privée</>}
            {currentView === 'settings' && <><Settings className="w-6 h-6 text-wedding-gold" /> Paramètres</>}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowManualMatchModal(true)}
              className="bg-wedding-gold text-wedding-navy px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg hover:shadow-wedding-gold/20 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nouveau Match
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6">



          {
            currentView === 'pipeline' && (
              <MatchPipeline matches={matches} profiles={profiles} onUpdateStatus={handleUpdateMatchStatus} />
            )
          }

          {
            currentView === 'tasks' && (
              <div className="max-w-4xl mx-auto pt-8 px-6 w-full">
                <div className="glass-card p-10 rounded-3xl border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-wedding-navy text-wedding-gold rounded-2xl shadow-xl">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-wedding-navy tracking-tight">Mes Notes</h2>
                      <p className="text-wedding-text/60 text-sm font-medium">Capturez vos pensées et rappels avec élégance.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-10">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="AJOUTER UNE NOUVELLE NOTE..."
                      className="flex-1 px-6 py-4 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 focus:ring-4 focus:ring-wedding-gold/5 transition-all font-bold text-xs uppercase tracking-widest text-wedding-navy placeholder:text-wedding-navy/20 shadow-inner"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <button
                      onClick={handleAddTask}
                      className="px-8 py-4 bg-wedding-navy text-white font-bold rounded-2xl hover:bg-wedding-navy/90 transition-all flex items-center gap-3 shadow-xl shadow-wedding-navy/20 active:scale-95 border border-wedding-gold/20 text-xs uppercase tracking-widest"
                    >
                      <Plus className="w-5 h-5 text-wedding-gold" />
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <div className="text-center py-16 bg-wedding-navy/5 rounded-3xl border border-dashed border-wedding-navy/10 text-wedding-text/30">
                        <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-10 text-wedding-gold" />
                        <p className="font-serif italic text-lg">Votre liste est vide, profitez de ce moment de sérénité.</p>
                      </div>
                    ) : (
                      tasks.sort((a, b) => b.createdAt - a.createdAt).map(task => (
                        <div key={task.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group ${task.completed ? 'bg-white/40 border-wedding-navy/5 opacity-60' : 'bg-white border-wedding-navy/5 hover:border-wedding-gold/30 shadow-sm hover:shadow-md'}`}>
                          <div className="flex items-center gap-5">
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-wedding-gold border-wedding-gold text-wedding-navy shadow-lg shadow-wedding-gold/20' : 'border-wedding-navy/10 hover:border-wedding-gold'}`}
                            >
                              {task.completed && <Check className="w-4 h-4" />}
                            </button>
                            <span className={`font-medium text-sm transition-all duration-300 ${task.completed ? 'text-wedding-navy/40 line-through' : 'text-wedding-navy'}`}>
                              {task.text}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2.5 text-wedding-navy/10 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          }



          {
            currentView === 'settings' && (
              <div className="max-w-4xl mx-auto pt-8 px-6 w-full h-full overflow-y-auto custom-scrollbar pb-16">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-wedding-navy text-wedding-gold rounded-2xl shadow-xl">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-wedding-navy tracking-tight">Paramètres Shadchan</h2>
                    <p className="text-wedding-text/60 text-sm font-medium">Gérez votre profil public et personnalisez votre expérience.</p>
                  </div>
                </div>

                <div className="glass-card p-10 rounded-3xl border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5 space-y-10">
                  <div className="flex items-center gap-8">
                    <div className="w-28 h-28 bg-wedding-navy/5 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl relative group ring-1 ring-wedding-navy/5">
                      {shadchanProfile?.image_url ? (
                        <img src={shadchanProfile.image_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-12 h-12 text-wedding-navy/20" />
                      )}
                      <div className="absolute inset-0 bg-wedding-navy/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm">
                        <label className="cursor-pointer text-white text-[10px] font-bold uppercase tracking-widest text-center px-4">
                          Modifier photo
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-serif font-bold text-wedding-navy">Photo de Profil</h3>
                      <p className="text-xs text-wedding-text/40 font-bold uppercase tracking-widest mt-1">Image format Carré recommandée (Min 400x400px)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest">Nom Complet</label>
                      <div className="flex gap-3">
                        <select
                          className="w-32 p-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs text-wedding-navy appearance-none cursor-pointer shadow-inner"
                          value={['Rav', 'Rabbanit', 'Mme', 'Mr', 'Dr'].find(t => shadchanProfile?.name?.startsWith(t + ' ')) || 'Rav'}
                          onChange={e => {
                            const newTitle = e.target.value;
                            const titles = ['Rav', 'Rabbanit', 'Mme', 'Mr', 'Dr'];
                            const currentTitle = titles.find(t => shadchanProfile?.name?.startsWith(t + ' '));
                            const currentName = currentTitle
                              ? shadchanProfile?.name?.substring(currentTitle.length + 1)
                              : shadchanProfile?.name || '';
                            setShadchanProfile({ ...shadchanProfile, name: `${newTitle} ${currentName}`.trim() });
                          }}
                        >
                          <option value="Rav">Rav</option>
                          <option value="Rabbanit">Rabbanit</option>
                          <option value="Mme">Mme</option>
                          <option value="Mr">Mr</option>
                          <option value="Dr">Dr</option>
                        </select>
                        <input
                          className="flex-1 p-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs text-wedding-navy shadow-inner placeholder:text-wedding-navy/20"
                          placeholder="Prénom Nom"
                          value={(() => {
                            const titles = ['Rav', 'Rabbanit', 'Mme', 'Mr', 'Dr'];
                            const currentTitle = titles.find(t => shadchanProfile?.name?.startsWith(t + ' '));
                            return currentTitle ? shadchanProfile?.name?.substring(currentTitle.length + 1) : shadchanProfile?.name || '';
                          })()}
                          onChange={e => {
                            const newName = e.target.value;
                            const titles = ['Rav', 'Rabbanit', 'Mme', 'Mr', 'Dr'];
                            const currentTitle = titles.find(t => shadchanProfile?.name?.startsWith(t + ' ')) || 'Rav';
                            setShadchanProfile({ ...shadchanProfile, name: `${currentTitle} ${newName}` });
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest">Titre / Rôle</label>
                      <input className="w-full p-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs text-wedding-navy shadow-inner"
                        value={shadchanProfile?.role || 'Shadchan Senior'}
                        onChange={e => setShadchanProfile({ ...shadchanProfile, role: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest">Biographie</label>
                    <textarea className="w-full p-5 bg-wedding-navy/5 border border-wedding-navy/5 rounded-3xl h-32 resize-none focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-medium text-sm text-wedding-navy shadow-inner leading-relaxed"
                      placeholder="Partagez votre expérience et votre approche du Shadchanout..."
                      value={shadchanProfile?.bio || ''}
                      onChange={e => setShadchanProfile({ ...shadchanProfile, bio: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest">Téléphone de contact</label>
                      <input className="w-full p-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs text-wedding-navy shadow-inner"
                        value={shadchanProfile?.phone || ''}
                        onChange={e => setShadchanProfile({ ...shadchanProfile, phone: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest">Email Public</label>
                      <input className="w-full p-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs text-wedding-navy shadow-inner"
                        value={shadchanProfile?.email || ''}
                        onChange={e => setShadchanProfile({ ...shadchanProfile, email: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-8 border-t border-wedding-navy/5">
                    <button
                      onClick={() => {
                        api.updateShadchanProfile(shadchanProfile)
                          .then(() => success('Profil sauvegardé avec succès'))
                          .catch(err => {
                            console.error(err);
                            showError("Erreur lors de la sauvegarde du profil");
                          });
                      }}
                      className="bg-wedding-navy text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-wedding-navy/90 transition-all flex items-center gap-3 shadow-2xl shadow-wedding-navy/20 active:scale-95 border border-wedding-gold/20"
                    >
                      <Save className="w-4 h-4 text-wedding-gold" /> Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {
            currentView === 'overview' && (
              <div className="max-w-6xl mx-auto pt-8 px-6 w-full h-full overflow-y-auto custom-scrollbar pb-12">
                <div className="mb-10 text-center md:text-left">
                  <h1 className="text-4xl font-serif font-bold text-wedding-navy tracking-tight">
                    Bonjour, <span className="text-wedding-gold italic">Shadchan</span>
                  </h1>
                  <p className="text-wedding-text/60 mt-2 font-medium tracking-wide">Voici un aperçu de l'activité du jour pour Binyan Adei Ad.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 border-wedding-navy/5 shadow-xl shadow-wedding-navy/5 hover:scale-105 transition-transform duration-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-wedding-navy/50 text-[10px] font-bold uppercase tracking-[0.2em]">Candidats</div>
                        <div className="text-4xl font-serif font-bold text-wedding-navy mt-1">{profiles.length}</div>
                      </div>
                      <div className="p-3 bg-wedding-navy rounded-xl shadow-lg ring-1 ring-white/10">
                        <Users className="w-5 h-5 text-wedding-gold" />
                      </div>
                    </div>
                    <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Base Active
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 border-wedding-navy/5 shadow-xl shadow-wedding-navy/5 hover:scale-105 transition-transform duration-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-wedding-navy/50 text-[10px] font-bold uppercase tracking-[0.2em]">Pipeline</div>
                        <div className="text-4xl font-serif font-bold text-wedding-navy mt-1">
                          {matches.filter(m => m.status !== MatchStatus.ARCHIVED && m.status !== MatchStatus.ENGAGED && m.status !== MatchStatus.DROPPED).length}
                        </div>
                      </div>
                      <div className="p-3 bg-wedding-navy rounded-xl shadow-lg ring-1 ring-white/10">
                        <Heart className="w-5 h-5 text-wedding-gold" />
                      </div>
                    </div>
                    <div className="text-[10px] text-wedding-navy/40 font-bold uppercase tracking-widest">Matchs en cours</div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 border-wedding-navy/5 shadow-xl shadow-wedding-navy/5 border-wedding-gold/20 hover:scale-105 transition-transform duration-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-wedding-navy/50 text-[10px] font-bold uppercase tracking-[0.2em]">Fiançailles</div>
                        <div className="text-4xl font-serif font-bold text-wedding-gold mt-1">
                          {matches.filter(m => m.status === MatchStatus.ENGAGED).length}
                        </div>
                      </div>
                      <div className="p-3 bg-wedding-gold rounded-xl shadow-lg shadow-wedding-gold/10">
                        <Sparkles className="w-5 h-5 text-wedding-navy" />
                      </div>
                    </div>
                    <div className="text-[10px] text-wedding-gold font-bold uppercase tracking-widest animate-pulse">Mazel Tov !</div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 border-wedding-navy/5 shadow-xl shadow-wedding-navy/5 hover:scale-105 transition-transform duration-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-wedding-navy/50 text-[10px] font-bold uppercase tracking-[0.2em]">Notes</div>
                        <div className="text-4xl font-serif font-bold text-wedding-navy mt-1">
                          {tasks.filter(t => !t.completed).length}
                        </div>
                      </div>
                      <div className="p-3 bg-wedding-navy rounded-xl shadow-lg ring-1 ring-white/10">
                        <CheckSquare className="w-5 h-5 text-wedding-gold" />
                      </div>
                    </div>
                    <div className="text-[10px] text-wedding-navy/40 font-bold uppercase tracking-widest">Post-it personnels</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Activity */}
                  <div className="glass-card rounded-2xl p-8 border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5">
                    <h3 className="font-serif font-bold text-xl text-wedding-navy mb-8 flex items-center gap-3">
                      <Activity className="w-6 h-6 text-wedding-gold" />
                      Journal d'Activité
                    </h3>
                    <div className="space-y-6">
                      {activities.length === 0 ? (
                        <p className="text-wedding-text/40 text-sm italic py-8 text-center bg-white/30 rounded-2xl border border-dashed border-wedding-navy/10">Aucun événement récent.</p>
                      ) : (
                        activities.slice(0, 5).map(act => (
                          <div key={act.id} className="flex gap-4 text-sm border-b border-wedding-navy/5 pb-5 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${act.type === 'MATCH_NEW' ? 'bg-wedding-gold' :
                              act.type === 'MATCH_STATUS' ? 'bg-wedding-navy' :
                                act.type === 'PROFILE_NEW' ? 'bg-green-400' :
                                  'bg-wedding-text/20'
                              }`} />
                            <div className="flex-1">
                              <p className="text-wedding-navy font-bold leading-tight">{act.description}</p>
                              <p className="text-[10px] text-wedding-text/40 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> {new Date(act.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="glass-card rounded-2xl p-8 border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5">
                    <h3 className="font-serif font-bold text-xl text-wedding-navy mb-8 flex items-center gap-3">
                      <Zap className="w-6 h-6 text-wedding-gold" />
                      Actions Rapides
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setCurrentView('profiles')} className="p-5 bg-wedding-navy/5 rounded-2xl hover:bg-wedding-navy hover:text-white transition-all duration-300 text-left group border border-wedding-navy/5 shadow-sm">
                        <Search className="w-8 h-8 text-wedding-gold mb-3 group-hover:scale-110 transition-transform duration-500" />
                        <div className="font-bold text-sm tracking-widest uppercase">Base Candidats</div>
                        <div className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">Rechercher un profil</div>
                      </button>
                      <button onClick={() => setCurrentView('tasks')} className="p-5 bg-wedding-navy/5 rounded-2xl hover:bg-wedding-navy hover:text-white transition-all duration-300 text-left group border border-wedding-navy/5 shadow-sm">
                        <CheckSquare className="w-8 h-8 text-wedding-gold mb-3 group-hover:scale-110 transition-transform duration-500" />
                        <div className="font-bold text-sm tracking-widest uppercase">Mes Notes</div>
                        <div className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">Capturez vos idées</div>
                      </button>
                      <button onClick={() => setCurrentView('pipeline')} className="p-5 bg-wedding-navy/5 rounded-2xl hover:bg-wedding-navy hover:text-white transition-all duration-300 text-left group border border-wedding-navy/5 shadow-sm">
                        <Kanban className="w-8 h-8 text-wedding-gold mb-3 group-hover:scale-110 transition-transform duration-500" />
                        <div className="font-bold text-sm tracking-widest uppercase">Match Pipeline</div>
                        <div className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">Voir l'avancement</div>
                      </button>
                      <button onClick={() => setShowManualMatchModal(true)} className="p-5 bg-wedding-navy/5 rounded-2xl hover:bg-wedding-navy hover:text-white transition-all duration-300 text-left group border border-wedding-navy/5 shadow-sm">
                        <Heart className="w-8 h-8 text-wedding-gold mb-3 group-hover:scale-110 transition-transform duration-500" />
                        <div className="font-bold text-sm tracking-widest uppercase">Nouveau Match</div>
                        <div className="text-[10px] opacity-60 mt-1 uppercase tracking-tighter">Création manuelle</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {
            currentView === 'profiles' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">

                {/* Sidebar - Liste des candidats */}
                <div className={`w-full lg:w-96 glass-card border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5 flex flex-col overflow-hidden shrink-0 print:hidden ${selectedProfile ? 'hidden lg:flex' : 'flex'}`}>
                  <div className="p-6 border-b border-wedding-navy/5 space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-serif font-bold text-wedding-navy uppercase tracking-luxury">
                        {selectedProfileIds.length > 0 ? (
                          <span className="text-wedding-gold flex items-center gap-2">
                            {selectedProfileIds.length} sélectionnés
                            <button
                              onClick={handleBulkDelete}
                              className="p-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                              title="Supprimer la sélection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          "Base Candidats"
                        )}
                      </h2>
                      {hasActiveFilters ? (
                        <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-wedding-text/40 hover:text-wedding-navy flex items-center gap-1.5 transition-colors">
                          <X className="w-3.5 h-3.5" /> Effacer
                        </button>
                      ) : (
                        <button onClick={selectAllFiltered} className="text-[10px] font-bold uppercase tracking-widest text-wedding-gold hover:text-wedding-navy transition-colors underline underline-offset-4">
                          {selectedProfileIds.length === filteredProfiles.length && filteredProfiles.length > 0 ? 'Désélectionner' : 'Tout sélectionner'}
                        </button>
                      )}
                    </div>

                    {/* Gender Toggles */}
                    <div className="flex bg-wedding-navy/5 p-1 rounded-2xl border border-wedding-navy/5">
                      <button
                        onClick={() => { setSelectedGender(Gender.MALE); setSelectedProfile(null); }}
                        className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${selectedGender === Gender.MALE ? 'bg-wedding-navy text-white shadow-xl scale-[1.02]' : 'text-wedding-navy/40 hover:text-wedding-navy'}`}
                      >
                        Hommes
                      </button>
                      <button
                        onClick={() => { setSelectedGender(Gender.FEMALE); setSelectedProfile(null); }}
                        className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${selectedGender === Gender.FEMALE ? 'bg-wedding-navy text-white shadow-xl scale-[1.02]' : 'text-wedding-navy/40 hover:text-wedding-navy'}`}
                      >
                        Femmes
                      </button>
                    </div>

                    {/* Search & Favorites */}
                    <div className="flex gap-3">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-wedding-gold w-4 h-4 transition-transform group-focus-within:scale-110" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl text-xs text-wedding-navy placeholder:text-wedding-navy/30 focus:outline-none focus:bg-white focus:border-wedding-gold/30 focus:ring-4 focus:ring-wedding-gold/5 transition-all shadow-inner"
                        />
                      </div>
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm ${showFavoritesOnly ? 'bg-wedding-gold border-wedding-gold text-wedding-navy scale-110 shadow-wedding-gold/20' : 'bg-wedding-navy/5 border-wedding-navy/5 text-wedding-gold hover:bg-wedding-navy/10'}`}
                        title="Favoris"
                      >
                        <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm ${privacyMode ? 'bg-wedding-navy border-wedding-navy text-white scale-110 shadow-wedding-navy/20' : 'bg-wedding-navy/5 border-wedding-navy/5 text-wedding-navy/40 hover:bg-wedding-navy/10'}`}
                        title="Mode Privé"
                      >
                        {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Tags Filter */}
                    {uniqueTags.length > 0 && (
                      <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar py-2">
                        <button
                          onClick={() => setSelectedTag('')}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${!selectedTag ? 'bg-wedding-navy text-white shadow-lg' : 'bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy/10'}`}
                        >
                          Tous
                        </button>
                        {uniqueTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${selectedTag === tag ? 'bg-wedding-gold text-wedding-navy shadow-lg shadow-wedding-gold/20' : 'bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy/10'}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Advanced Filters */}
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={selectedReligiousLevel}
                        onChange={(e) => setSelectedReligiousLevel(e.target.value)}
                        className="col-span-2 w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all cursor-pointer shadow-inner"
                      >
                        <option value="">Toute Hashkafa</option>
                        {Object.values(ReligiousLevel).map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>

                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all cursor-pointer shadow-inner"
                      >
                        <option value="">Toute Ville</option>
                        {uniqueCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>

                      {/* Sort Dropdown */}
                      <div className="relative w-full">
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as SortOption)}
                          className="w-full appearance-none bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all cursor-pointer shadow-inner"
                        >
                          <option value="newest">Plus récent</option>
                          <option value="oldest">Plus ancien</option>
                          <option value="age_asc">Âge (croissant)</option>
                          <option value="age_desc">Âge (décroissant)</option>
                          <option value="name_asc">Nom (A-Z)</option>
                          <option value="name_desc">Nom (Z-A)</option>
                        </select>
                        <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-wedding-gold pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                    {filteredProfiles.length === 0 ? (
                      <div className="text-center text-wedding-navy/30 mt-12 p-8 flex flex-col items-center glass-card border-dashed border-wedding-navy/10">
                        <Users className="w-12 h-12 mb-4 opacity-20 text-wedding-gold" />
                        <p className="font-serif italic">{hasActiveFilters ? 'Aucun résultat trouvé.' : 'Votre base est vide.'}</p>
                      </div>
                    ) : (
                      filteredProfiles.map(profile => (
                        <div
                          key={profile.id}
                          onClick={() => handleProfileSelect(profile)}
                          className={`p-5 rounded-2xl cursor-pointer transition-all duration-500 group relative border ${selectedProfile?.id === profile.id ? 'bg-wedding-navy text-white shadow-2xl shadow-wedding-navy/30 border-wedding-navy scale-[1.02]' : 'bg-white/40 hover:bg-white/80 text-wedding-navy border-transparent hover:border-wedding-gold/20 shadow-sm'}`}
                        >
                          <button
                            onClick={(e) => toggleFavorite(e, profile)}
                            className={`absolute top-5 right-5 p-1.5 rounded-full transition-all duration-300 ${profile.isFavorite ? 'text-wedding-gold opacity-100 scale-110' : 'text-wedding-navy/10 opacity-0 group-hover:opacity-100 hover:text-wedding-gold'}`}
                          >
                            <Star className={`w-4 h-4 ${profile.isFavorite ? 'fill-current' : ''}`} />
                          </button>

                          <div className="flex justify-between items-center pr-8">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => toggleProfileSelection(profile.id, e)}
                                className={`transition-all duration-300 ${selectedProfileIds.includes(profile.id) ? 'text-wedding-gold' : 'text-wedding-navy/20 hover:text-wedding-gold'}`}
                              >
                                {selectedProfileIds.includes(profile.id) ? <CheckCircle2 className="w-6 h-6 fill-wedding-gold/20" /> : <Square className="w-6 h-6" />}
                              </button>
                              <div>
                                <h3 className={`font-serif font-bold text-lg leading-tight ${selectedProfile?.id === profile.id ? 'text-white' : 'text-wedding-navy'}`}>
                                  {privacyMode ? `${profile.firstName} ${profile.lastName.charAt(0)}.` : `${profile.firstName} ${profile.lastName}`}
                                </h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${selectedProfile?.id === profile.id ? 'bg-white/20 text-white' : 'bg-wedding-gold/10 text-wedding-gold'}`}>{profile.age} ans</span>
                                  <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-60 ${selectedProfile?.id === profile.id ? 'text-white/70' : 'text-wedding-navy/70'}`}>{profile.city}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className={`text-[10px] mt-3 font-bold uppercase tracking-[0.1em] truncate opacity-50 ${selectedProfile?.id === profile.id ? 'text-white/60' : 'text-wedding-navy/60'}`}>{profile.religiousLevel}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Main Detail View */}
                <div className={`flex-1 glass-card border-wedding-navy/5 overflow-hidden flex flex-col print:shadow-none print:border-none print:h-auto print:overflow-visible relative ${!selectedProfile ? 'hidden lg:flex' : 'flex'}`}>
                  {!selectedProfile && (
                    <div className="absolute inset-0 p-12 flex flex-col items-center justify-center bg-white/40 backdrop-blur-subtle">
                      <div className="max-w-md w-full text-center">
                        <div className="w-24 h-24 glass-card shadow-2xl shadow-wedding-gold/10 flex items-center justify-center mx-auto mb-8 border-wedding-gold/30">
                          <Activity className="w-10 h-10 text-wedding-gold" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-wedding-navy mb-3">Activité Récente</h2>
                        <p className="text-wedding-text/60 font-medium tracking-wide mb-12">Consultez les derniers événements de votre plateforme.</p>

                        <div className="space-y-4">
                          {activities.length === 0 ? (
                            <p className="text-center text-wedding-text/40 italic py-8 border border-dashed border-wedding-navy/10 rounded-3xl">Aucun événement à afficher.</p>
                          ) : (
                            activities.slice(0, 4).map(activity => (
                              <div key={activity.id} className="glass-card p-5 border-wedding-navy/5 shadow-xl shadow-wedding-navy/5 flex items-start gap-5 hover:scale-[1.02] transition-transform duration-300 text-left">
                                <div className={`p-3 rounded-2xl shrink-0 shadow-lg ${activity.type === 'MATCH_NEW' ? 'bg-wedding-gold text-wedding-navy' :
                                  activity.type === 'MATCH_STATUS' ? 'bg-wedding-navy text-white' :
                                    activity.type === 'PROFILE_NEW' ? 'bg-green-100 text-green-700' :
                                      'bg-white text-wedding-navy border border-wedding-navy/10'
                                  }`}>
                                  {activity.type === 'MATCH_NEW' && <Sparkles className="w-5 h-5" />}
                                  {activity.type === 'MATCH_STATUS' && <Kanban className="w-5 h-5" />}
                                  {activity.type === 'PROFILE_NEW' && <Users className="w-5 h-5" />}
                                  {activity.type === 'NOTE_ADDED' && <FileText className="w-5 h-5" />}
                                  {activity.type === 'EXPORT_DATA' && <Save className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-wedding-navy leading-tight truncate">{activity.description}</p>
                                  <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-wedding-text/40 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5 text-wedding-gold" />
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedProfile ? (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:overflow-visible print:h-auto">
                      <button
                        onClick={() => setSelectedProfile(null)}
                        className="lg:hidden mb-6 flex items-center gap-2 text-wedding-navy/60 hover:text-wedding-navy font-bold text-[10px] uppercase tracking-widest transition-colors bg-wedding-navy/5 px-4 py-2 rounded-full"
                      >
                        <ChevronLeft className="w-4 h-4 text-wedding-gold" />
                        Retour à la liste
                      </button>
                      {/* Header Profil */}
                      <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
                        <div className="relative group shrink-0">
                          <img
                            src={selectedProfile.imageUrl}
                            alt="Profile"
                            className="w-40 h-40 rounded-3xl object-cover shadow-2xl border-4 border-white ring-1 ring-wedding-navy/5 bg-wedding-navy/5"
                          />
                          <div className="absolute -bottom-3 -right-3 p-3 bg-wedding-gold text-wedding-navy rounded-2xl shadow-xl ring-4 ring-white">
                            <Heart className="w-5 h-5 fill-current" />
                          </div>
                        </div>
                        <div className="flex-1 w-full pt-2">
                          <div className="flex flex-wrap justify-between items-start gap-6">
                            <div>
                              <div className="flex items-center gap-4">
                                <h1 className="text-5xl font-serif font-bold text-wedding-navy mb-2 tracking-tight">{selectedProfile.firstName} {selectedProfile.lastName}</h1>
                                <div className="flex gap-2">
                                  <button onClick={(e) => toggleFavorite(e, selectedProfile)} className={`p-2.5 rounded-2xl transition-all duration-300 shadow-sm ${selectedProfile.isFavorite ? 'text-wedding-navy bg-wedding-gold ring-1 ring-wedding-gold' : 'text-wedding-navy/20 bg-white border border-wedding-navy/5 hover:text-wedding-gold hover:border-wedding-gold'}`}>
                                    <Star className={`w-6 h-6 ${selectedProfile.isFavorite ? 'fill-current' : ''}`} />
                                  </button>
                                  <button onClick={handlePrintProfile} className="p-2.5 rounded-2xl text-wedding-navy/20 bg-white border border-wedding-navy/5 hover:text-wedding-navy hover:border-wedding-navy transition-all shadow-sm" title="Imprimer le CV">
                                    <Printer className="w-6 h-6" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-6 mt-4">
                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-wedding-text/60"><MapPin className="w-4 h-4 text-wedding-gold" /> {selectedProfile.city}</span>
                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-wedding-text/60"><Briefcase className="w-4 h-4 text-wedding-gold" /> {selectedProfile.occupation}</span>
                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-wedding-text/60"><Ruler className="w-4 h-4 text-wedding-gold" /> {selectedProfile.height}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <span className="px-6 py-2 rounded-full bg-wedding-navy text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-wedding-navy/20">
                                {selectedProfile.religiousLevel}
                              </span>
                              <span className="text-[10px] font-bold text-wedding-gold uppercase tracking-widest italic pr-2">ID: {selectedProfile.id.slice(0, 8)}</span>

                              {/* Shadchan Assignment */}
                              <div className="flex flex-col items-end gap-1 mt-2">
                                <span className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest">Shadchan Référent</span>
                                <select
                                  value={selectedProfile.assignedShadchanId || ''}
                                  onChange={(e) => handleShadchanAssignment(Number(e.target.value))}
                                  className="bg-white/40 border border-wedding-navy/5 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:border-wedding-gold/30 cursor-pointer shadow-sm appearance-none hover:bg-white/60 transition-colors text-right"
                                >
                                  <option value="">NON ASSIGNÉ</option>
                                  {shadchans.map(s => (
                                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 flex gap-4">
                            <div className="px-6 py-3 bg-wedding-navy/5 rounded-2xl text-wedding-navy text-sm font-bold flex items-center gap-3 border border-wedding-navy/5 shadow-inner">
                              <Phone className="w-4 h-4 text-wedding-gold" />
                              {privacyMode ? '•• •• •• •• ••' : selectedProfile.contactPhone}
                            </div>

                            {selectedProfile.contactPhone && (
                              <a
                                href={`https://wa.me/${selectedProfile.contactPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-[#25D366]/10 text-[#075E54] rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all shadow-sm"
                              >
                                <MessageCircle className="w-5 h-5 fill-current" /> WhatsApp
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2.5 mt-6">
                            {selectedProfile.tags?.map(tag => (
                              <span key={tag} className="px-3 py-1.5 bg-wedding-gold/10 text-wedding-navy rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group/tag border border-wedding-gold/20">
                                <Tag className="w-3.5 h-3.5 text-wedding-gold" /> {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                className="px-3 py-1.5 bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl text-[10px] focus:outline-none focus:border-wedding-gold/30 w-28 font-bold uppercase tracking-widest placeholder:text-wedding-navy/20"
                                placeholder="AJOUTER TAG..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              />
                              <button onClick={handleAddTag} className="p-1.5 hover:bg-wedding-navy/5 rounded-xl transition-colors">
                                <Plus className="w-4 h-4 text-wedding-gold" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                        <div className="prose prose-slate max-w-none">
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Parcours & Personnalité
                          </h3>
                          <div className="space-y-4">
                            {selectedProfile.educationalPath && (
                              <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Parcours Scolaire</p>
                                <p className="text-wedding-navy/80 leading-relaxed font-medium">{selectedProfile.educationalPath}</p>
                              </div>
                            )}
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Description de soi</p>
                              <p className="text-wedding-navy/80 leading-relaxed font-medium">
                                {selectedProfile.selfDescription || selectedProfile.aboutMe}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-slate max-w-none">
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Recherche & Vision
                          </h3>
                          <div className="space-y-4">
                            <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner italic">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 not-italic">Profil Idéal</p>
                              <p className="text-wedding-navy/90 font-medium leading-relaxed">
                                {selectedProfile.lookingFor}
                              </p>
                            </div>
                            {selectedProfile.ambitions && (
                              <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner italic">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 not-italic">Ambitions & Projets</p>
                                <p className="text-wedding-navy/90 font-medium leading-relaxed">{selectedProfile.ambitions}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Famille & Parents
                          </h3>
                          <div className="space-y-4">
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Père</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.fatherName || 'Non renseigné'}</p>
                                  {selectedProfile.fatherPhone && <p className="text-[10px] text-wedding-gold font-bold mt-1">{selectedProfile.fatherPhone}</p>}
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Mère</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.motherName || 'Non renseigné'}</p>
                                  {selectedProfile.motherPhone && <p className="text-[10px] text-wedding-gold font-bold mt-1">{selectedProfile.motherPhone}</p>}
                                </div>
                              </div>
                            </div>
                            {selectedProfile.familyDescription && (
                              <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Structure Familiale</p>
                                <p className="text-sm font-medium text-wedding-navy/80 leading-relaxed whitespace-pre-wrap">{selectedProfile.familyDescription}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Communauté & Contacts
                          </h3>
                          <div className="space-y-4">
                            {selectedProfile.community && (
                              <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Fidélité Religieuse (Kehila)</p>
                                <p className="text-sm font-bold text-wedding-navy">{selectedProfile.community}</p>
                              </div>
                            )}
                            {selectedProfile.rabbanimContacts && (
                              <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Références Rabbanims</p>
                                <p className="text-sm font-medium text-wedding-navy/80 leading-relaxed whitespace-pre-wrap">{selectedProfile.rabbanimContacts}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedProfile.photos && selectedProfile.photos.length > 0 && (
                        <div className="mb-12">
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Galerie Photos
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {selectedProfile.photos.map((photo, idx) => (
                              <div key={idx} className="group relative rounded-3xl overflow-hidden h-48 border-4 border-white shadow-xl cursor-pointer transition-all duration-500 hover:scale-105 hover:rotate-1" onClick={() => window.open(photo, '_blank')}>
                                <img src={photo} alt={`Galerie ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-wedding-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProfile.references && selectedProfile.references.length > 0 && (
                        <div className="mb-12">
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Références
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedProfile.references.map((ref, idx) => (
                              <div key={idx} className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="font-serif font-bold text-lg text-wedding-navy">{ref.name}</p>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-widest mt-1">{ref.relation}</p>
                                </div>
                                <div className="text-xs font-bold text-wedding-navy bg-white px-4 py-2 rounded-xl shadow-lg ring-1 ring-wedding-navy/5">
                                  {ref.contact}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents Section */}
                      <div className="mb-12">
                        <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                          Documents
                        </h3>
                        <div className="glass-card !bg-white/40 border-wedding-navy/5 overflow-hidden mb-6">
                          {selectedProfile.documents && selectedProfile.documents.length > 0 ? (
                            <div className="divide-y divide-wedding-navy/5">
                              {selectedProfile.documents.map(doc => (
                                <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-white/60 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-wedding-navy text-wedding-gold rounded-2xl shadow-lg">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-wedding-navy">{doc.name}</p>
                                      <p className="text-[10px] font-bold text-wedding-text/40 uppercase tracking-widest">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const url = await api.getDownloadUrl(doc.url);
                                        window.open(url, '_blank');
                                      } catch (e) {
                                        console.error(e);
                                        alert("Erreur lors de l'ouverture du document.");
                                      }
                                    }}
                                    className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest bg-white text-wedding-navy border border-wedding-navy/5 rounded-xl hover:bg-wedding-navy hover:text-white transition-all shadow-sm"
                                  >
                                    {doc.url.startsWith('private://') ? 'Télécharger' : 'Voir'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-10 text-center text-wedding-text/40 text-xs italic font-serif text-wedding-navy/50">
                              Aucun document associé à ce profil.
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-1 relative group">
                            <input
                              type="text"
                              value={newDocName}
                              onChange={(e) => setNewDocName(e.target.value)}
                              placeholder="NOM DU DOCUMENT..."
                              className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all shadow-inner placeholder:text-wedding-navy/20"
                            />
                          </div>
                          <label className="flex items-center justify-center p-3 bg-white border border-wedding-navy/5 rounded-2xl cursor-pointer hover:bg-wedding-navy/5 transition-all shadow-sm group">
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    success("Envoi en cours...");
                                    const url = await api.uploadFile('documents', e.target.files[0]);
                                    setNewDocUrl(url);
                                    success("Fichier prêt ! Cliquez sur + pour valider.");
                                  } catch (err) {
                                    console.error(err);
                                    alert("Erreur lors de l'upload");
                                  }
                                }
                              }}
                            />
                            <Upload className="w-5 h-5 text-wedding-gold transition-transform group-hover:scale-110" />
                          </label>
                          <button onClick={handleAddDocument} disabled={!newDocName || !newDocUrl} className="p-3 bg-wedding-navy text-white rounded-2xl hover:bg-wedding-navy/90 transition-all shadow-xl disabled:opacity-50">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Private Notes Section */}
                      <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Notes Privées (Shadchan)
                          </h3>
                          {selectedProfile.privateNotes !== noteBuffer && (
                            <button
                              onClick={saveNotes}
                              className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-wedding-navy text-white px-5 py-2 rounded-full hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20"
                            >
                              <Save className="w-4 h-4 text-wedding-gold" /> Enregistrer
                            </button>
                          )}
                        </div>
                        <textarea
                          className="w-full bg-wedding-gold/5 border border-wedding-gold/10 rounded-3xl p-6 text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 focus:ring-4 focus:ring-wedding-gold/5 transition-all min-h-[150px] shadow-inner font-medium leading-relaxed"
                          placeholder="Ajoutez vos notes personnelles sur ce candidat ici..."
                          value={noteBuffer}
                          onChange={(e) => setNoteBuffer(e.target.value)}
                        />
                        <p className="text-[10px] text-wedding-text/40 mt-3 italic font-serif">Ces informations sont confidentielles et visibles uniquement par vous.</p>
                      </div>

                      {/* Interaction History Section */}
                      <div className="mb-12">
                        <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                          Historique des Échanges
                        </h3>
                        <div className="glass-card !bg-white/40 border-wedding-navy/5 overflow-hidden mb-6">
                          {selectedProfile.interactionHistory && selectedProfile.interactionHistory.length > 0 ? (
                            <div className="divide-y divide-wedding-navy/5">
                              {selectedProfile.interactionHistory.sort((a, b) => b.date - a.date).map(interaction => (
                                <div key={interaction.id} className="p-6 flex gap-6 hover:bg-white/60 transition-colors">
                                  <div className={`p-3 rounded-2xl h-fit shadow-lg ${interaction.type === 'CALL' ? 'bg-wedding-navy text-white' : interaction.type === 'MEETING' ? 'bg-wedding-gold text-wedding-navy' : 'bg-white text-wedding-navy border border-wedding-navy/10'}`}>
                                    {interaction.type === 'CALL' && <Phone className="w-5 h-5" />}
                                    {interaction.type === 'MEETING' && <Users className="w-5 h-5" />}
                                    {(interaction.type === 'EMAIL' || interaction.type === 'OTHER') && <Briefcase className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-[10px] font-bold text-wedding-navy uppercase tracking-widest">{new Date(interaction.date).toLocaleDateString()}</span>
                                      <span className="text-[10px] text-wedding-gold font-bold uppercase tracking-widest border border-wedding-gold/30 px-2 py-0.5 rounded-lg">{interaction.type}</span>
                                    </div>
                                    <p className="text-sm font-medium text-wedding-navy/80 leading-relaxed">{interaction.notes}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-10 text-center text-wedding-text/40 text-xs italic font-serif py-12">Aucun historique d'échange enregistré.</div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <select
                            value={interactionType}
                            onChange={(e) => setInteractionType(e.target.value)}
                            className="bg-white border border-wedding-navy/5 rounded-2xl px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:border-wedding-gold/30 transition-all shadow-sm cursor-pointer"
                          >
                            <option value="CALL">Appel</option>
                            <option value="MEETING">Rencontre</option>
                            <option value="EMAIL">Email</option>
                            <option value="OTHER">Autre</option>
                          </select>
                          <input
                            type="text"
                            value={interactionNotes}
                            onChange={(e) => setInteractionNotes(e.target.value)}
                            placeholder="NOTES SUR L'ÉCHANGE..."
                            className="flex-1 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all shadow-inner placeholder:text-wedding-navy/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddInteraction()}
                          />
                          <button onClick={handleAddInteraction} className="p-3 bg-wedding-navy text-white rounded-2xl hover:bg-wedding-navy/90 transition-all shadow-xl">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-wedding-navy/5 pt-12 mt-12">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                          <div>
                            <h3 className="text-2xl font-serif font-bold text-wedding-navy flex items-center gap-3">
                              <Sparkles className="w-6 h-6 text-wedding-gold" />
                              Suggestions de Compatibilité
                            </h3>
                            <p className="text-wedding-text/60 text-sm mt-2 font-medium">Analyse basée sur la Hashkafa, l'âge et les valeurs profondes.</p>

                            <button
                              onClick={() => setShowAdvancedMatch(!showAdvancedMatch)}
                              className="text-wedding-gold text-[10px] font-bold uppercase tracking-widest hover:text-wedding-navy flex items-center gap-1.5 mt-4 transition-colors"
                            >
                              {showAdvancedMatch ? '- Masquer les critères' : '+ Critères de recherche avancés'}
                            </button>

                            {showAdvancedMatch && (
                              <div className="mt-6 glass-card p-6 border-wedding-navy/5 grid grid-cols-2 gap-6 text-sm animate-fade-in w-full max-w-xl">
                                <div>
                                  <label className="block text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Âge Min / Max</label>
                                  <div className="flex gap-3">
                                    <input
                                      type="number"
                                      className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl px-3 py-2 text-xs text-wedding-navy focus:outline-none focus:bg-white"
                                      placeholder="Min"
                                      value={matchCriteria.minAge || ''}
                                      onChange={e => setMatchCriteria({ ...matchCriteria, minAge: e.target.value ? parseInt(e.target.value) : undefined })}
                                    />
                                    <input
                                      type="number"
                                      className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl px-3 py-2 text-xs text-wedding-navy focus:outline-none focus:bg-white"
                                      placeholder="Max"
                                      value={matchCriteria.maxAge || ''}
                                      onChange={e => setMatchCriteria({ ...matchCriteria, maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Occupation</label>
                                  <input
                                    type="text"
                                    className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl px-4 py-2 text-xs text-wedding-navy focus:outline-none focus:bg-white"
                                    placeholder="Ex: Médecin"
                                    value={matchCriteria.occupation || ''}
                                    onChange={e => setMatchCriteria({ ...matchCriteria, occupation: e.target.value })}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Hashkafa Requise</label>
                                  <div className="flex flex-wrap gap-3">
                                    {Object.values(ReligiousLevel).slice(0, 4).map(level => (
                                      <label key={level} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-wedding-navy/60 cursor-pointer hover:text-wedding-navy transition-colors">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 rounded-md border-wedding-navy/20 text-wedding-navy focus:ring-wedding-gold"
                                          checked={matchCriteria.preferredHashkafa?.includes(level) || false}
                                          onChange={e => {
                                            const current = matchCriteria.preferredHashkafa || [];
                                            if (e.target.checked) {
                                              setMatchCriteria({ ...matchCriteria, preferredHashkafa: [...current, level] });
                                            } else {
                                              setMatchCriteria({ ...matchCriteria, preferredHashkafa: current.filter(l => l !== level) });
                                            }
                                          }}
                                        />
                                        {level}
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="col-span-1">
                                  <label className="block text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Statut Aliyah</label>
                                  <select
                                    className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl px-3 py-2 text-xs text-wedding-navy focus:outline-none focus:bg-white"
                                    value={matchCriteria.aliyahStatus || ''}
                                    onChange={(e) => setMatchCriteria({ ...matchCriteria, aliyahStatus: e.target.value })}
                                  >
                                    <option value="">Peu importe</option>
                                    <option value="Oleh Hadash">Oleh Hadash</option>
                                    <option value="Citoyen">Citoyen</option>
                                    <option value="Touriste">Touriste</option>
                                    <option value="En cours">En cours</option>
                                  </select>
                                </div>

                                <div className="col-span-1">
                                  <label className="block text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Langues</label>
                                  <select
                                    multiple
                                    className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-xl px-3 py-2 text-xs h-24 text-wedding-navy focus:outline-none focus:bg-white"
                                    value={matchCriteria.languages || []}
                                    onChange={(e) => {
                                      const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                      setMatchCriteria({ ...matchCriteria, languages: options });
                                    }}
                                  >
                                    <option value="Français">Français</option>
                                    <option value="Anglais">Anglais</option>
                                    <option value="Hébreu">Hébreu</option>
                                    <option value="Espagnol">Espagnol</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={runAIMatchmaking}
                            disabled={isAnalyzing}
                            className="px-8 py-4 bg-wedding-navy text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-wedding-navy/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 border border-wedding-gold/20"
                          >
                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin text-wedding-gold" /> : <Search className="w-5 h-5 text-wedding-gold" />}
                            {isAnalyzing ? 'Analyse...' : 'Trouver des profils'}
                          </button>
                        </div>

                        {/* Loader Squelette */}
                        {isAnalyzing && (
                          <div className="grid grid-cols-1 gap-6">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="glass-card border-wedding-navy/5 p-8 h-48 relative overflow-hidden flex flex-col gap-6">
                                <div className="flex items-start gap-6">
                                  <Skeleton className="w-16 h-16 rounded-3xl shrink-0 bg-wedding-navy/5" />
                                  <div className="space-y-3 flex-1 pt-2">
                                    <Skeleton className="h-5 w-1/3 bg-wedding-navy/5 rounded-lg" />
                                    <Skeleton className="h-4 w-1/4 bg-wedding-navy/5 rounded-lg" />
                                  </div>
                                </div>
                                <Skeleton className="h-20 w-full rounded-2xl bg-wedding-navy/5" />
                              </div>
                            ))}
                          </div>
                        )}

                        {!isAnalyzing && suggestions && (
                          <div className="grid grid-cols-1 gap-6 animate-fade-in pb-12">
                            {suggestions.length === 0 ? (
                              <div className="text-center py-12 glass-card border-dashed border-wedding-navy/10 !bg-wedding-navy/5">
                                <p className="text-wedding-navy/40 italic font-serif">Aucune suggestion pertinente trouvée dans la base actuelle.</p>
                              </div>
                            ) : (
                              suggestions.map((sugg, idx) => {
                                const matchProfile = getProfileById(sugg.candidateId);
                                if (!matchProfile) return null;
                                return (
                                  <div key={idx} className="glass-card p-8 border-wedding-navy/5 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group hover:scale-[1.01]">
                                    <div className="absolute top-0 right-0 p-6">
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="bg-wedding-gold text-wedding-navy px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-wedding-gold/20 flex items-center gap-2">
                                          <Sparkles className="w-3.5 h-3.5 fill-current" /> {sugg.matchPercentage}% de match
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-6 mb-6">
                                      <div className="relative">
                                        <img
                                          src={matchProfile.imageUrl}
                                          className="w-16 h-16 rounded-2xl object-cover bg-wedding-navy/5 border-2 border-white shadow-md"
                                          alt=""
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                                      </div>
                                      <div className="pt-1">
                                        <h4 className="font-serif font-bold text-xl text-wedding-navy underline decoration-wedding-gold/30 underline-offset-8 decoration-2">{matchProfile.firstName} {matchProfile.lastName}</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-wedding-text/40 mt-3">{matchProfile.age} ans • {matchProfile.city}</p>
                                      </div>
                                    </div>

                                    <div className="bg-wedding-navy/5 rounded-2xl p-6 mb-6 border border-wedding-navy/5 shadow-inner">
                                      <p className="text-wedding-navy/70 text-sm italic font-medium leading-relaxed">"{sugg.reasoning}"</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-wedding-navy/5">
                                      <div className="text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em]">
                                        {matchProfile.religiousLevel}
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); createMatchFromSuggestion(matchProfile, sugg.reasoning); }}
                                          className="text-white bg-wedding-navy hover:bg-wedding-navy/90 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-wedding-navy/20 transition-all active:scale-95"
                                        >
                                          <Kanban className="w-3.5 h-3.5 text-wedding-gold" /> Ajouter au Pipeline
                                        </button>
                                        <button
                                          onClick={() => handleViewMatch(matchProfile)}
                                          className="text-wedding-navy/40 text-[10px] font-bold uppercase tracking-widest hover:text-wedding-navy transition-colors flex items-center gap-2"
                                        >
                                          Voir profil <ChevronRight className="w-4 h-4 text-wedding-gold" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-wedding-navy/20">
                      <div className="w-32 h-32 rounded-3xl glass-card flex items-center justify-center mb-8 border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5">
                        <Heart className="w-12 h-12 text-wedding-gold opacity-30" />
                      </div>
                      <p className="text-2xl font-serif text-wedding-navy/40 italic">Sélectionnez un candidat pour commencer.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          }



          {/* Manual Match Modal */}
          {
            showManualMatchModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-wedding-navy/40 backdrop-blur-md">
                <div className="glass-card p-10 w-full max-w-md border-wedding-navy/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Heart className="w-32 h-32 text-wedding-gold" />
                  </div>

                  <div className="flex justify-between items-center mb-10 relative">
                    <h3 className="text-2xl font-serif font-bold text-wedding-navy tracking-tight">Nouveau Match Manuel</h3>
                    <button onClick={() => setShowManualMatchModal(false)} className="text-wedding-navy/20 hover:text-wedding-navy transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6 relative">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Candidat (Homme)</label>
                      <select
                        value={manualMatchBoyId}
                        onChange={(e) => setManualMatchBoyId(e.target.value)}
                        className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 appearance-none cursor-pointer shadow-inner"
                      >
                        <option value="">Sélectionner...</option>
                        {profiles.filter(p => p.gender === Gender.MALE).map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2">Candidate (Femme)</label>
                      <select
                        value={manualMatchGirlId}
                        onChange={(e) => setManualMatchGirlId(e.target.value)}
                        className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 appearance-none cursor-pointer shadow-inner"
                      >
                        <option value="">Sélectionner...</option>
                        {profiles.filter(p => p.gender === Gender.FEMALE).map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4 relative">
                    <button
                      onClick={() => setShowManualMatchModal(false)}
                      className="flex-1 px-4 py-4 bg-wedding-navy/5 text-wedding-navy rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-wedding-navy/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleManualMatchSubmit}
                      className="flex-1 px-4 py-4 bg-wedding-navy text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 border border-wedding-gold/20 flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-wedding-gold" /> Créer Match
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* Template Editor Modal */}

          {
            currentView === 'messages' && (
              <div className="max-w-6xl mx-auto pt-8 px-6 w-full h-full flex gap-8 pb-10">
                {/* Sidebar List */}
                <div className="w-80 glass-card border-wedding-navy/5 overflow-hidden flex flex-col h-[700px] shadow-2xl shadow-wedding-navy/5">
                  <div className="p-6 border-b border-wedding-navy/5 bg-wedding-navy/5">
                    <h3 className="text-sm font-serif font-bold text-wedding-navy uppercase tracking-luxury">Conversations</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {profiles.map(p => {
                      const assignedS = shadchans.find(s => s.id === p.assignedShadchanId);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setChatProfile(p)}
                          className={`p-5 border-b border-wedding-navy/5 cursor-pointer transition-all duration-300 ${chatProfile?.id === p.id ? 'bg-wedding-navy text-white shadow-xl scale-[1.02] relative z-10' : 'hover:bg-white/60'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`font-bold text-sm leading-tight ${chatProfile?.id === p.id ? 'text-white' : 'text-wedding-navy'}`}>{p.firstName} {p.lastName}</div>
                            {assignedS && (
                              <div className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter ${chatProfile?.id === p.id ? 'bg-white/20 text-white' : 'bg-wedding-gold/20 text-wedding-gold'}`}>
                                {assignedS.name.split(' ')[0]}
                              </div>
                            )}
                          </div>
                          <div className={`text-[10px] uppercase font-bold tracking-widest mt-1.5 opacity-40 truncate ${chatProfile?.id === p.id ? 'text-white/60' : 'text-wedding-navy/60'}`}>
                            Dernier message...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 glass-card border-wedding-navy/5 overflow-hidden flex flex-col h-[700px] shadow-2xl shadow-wedding-navy/5">
                  {chatProfile ? (
                    <>
                      <div className="p-6 border-b border-wedding-navy/5 flex items-center justify-between bg-white/40 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-wedding-navy text-wedding-gold flex items-center justify-center text-lg font-serif font-bold shadow-lg border-2 border-white ring-1 ring-wedding-navy/5">
                            {chatProfile.firstName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-xl text-wedding-navy leading-tight">{chatProfile.firstName} {chatProfile.lastName}</h3>
                            <p className="text-[10px] text-green-600 flex items-center gap-1.5 font-bold uppercase tracking-widest mt-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-200"></span>
                              Actif maintenant
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 p-8 overflow-y-auto bg-wedding-navy/[0.02] space-y-6">
                        {/* Messages List */}
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-wedding-navy/20">
                            <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-xl border border-wedding-navy/5">
                              <MessageCircle className="w-10 h-10 text-wedding-gold opacity-30" />
                            </div>
                            <div className="text-xl font-serif italic">Aucun message pour le moment.</div>
                            <p className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-50">Commencez la discussion !</p>
                          </div>
                        ) : (
                          messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.direction === 'FROM_SHADCHAN' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-5 rounded-3xl text-sm shadow-xl transition-transform hover:scale-[1.02] ${msg.direction === 'FROM_SHADCHAN'
                                ? 'bg-wedding-navy text-white rounded-tr-none shadow-wedding-navy/10 border border-wedding-gold/10'
                                : 'bg-white border-wedding-navy/5 text-wedding-navy rounded-tl-none shadow-wedding-navy/5'
                                }`}>
                                <div className="leading-relaxed font-medium">{msg.content}</div>
                                <div className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${msg.direction === 'FROM_SHADCHAN' ? 'text-wedding-gold/60' : 'text-wedding-navy/40'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-6 bg-white/40 border-t border-wedding-navy/5 backdrop-blur-md">
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder="ÉCRIVEZ VOTRE MESSAGE..."
                            className="flex-1 px-6 py-4 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-bold text-xs uppercase tracking-widest text-wedding-navy placeholder:text-wedding-navy/20 shadow-inner"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button onClick={handleSendMessage} className="p-4 bg-wedding-navy text-white rounded-2xl hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 border border-wedding-gold/20 active:scale-95">
                            <Send className="w-6 h-6 text-wedding-gold" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-wedding-navy/10">
                      <div className="w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center mb-8 shadow-2xl border border-wedding-navy/5">
                        <MessageCircle className="w-12 h-12 text-wedding-gold opacity-20" />
                      </div>
                      <p className="text-2xl font-serif italic text-wedding-navy/30">Sélectionnez un candidat pour discuter</p>
                    </div>
                  )}
                </div>
              </div>
            )
          }
        </div>
      </main >
    </div >
  );
};

export default ShadchanDashboard;