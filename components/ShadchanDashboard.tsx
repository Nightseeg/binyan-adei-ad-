import React, { useState, useEffect, useRef } from 'react';
import { Profile, Gender, ReligiousLevel, Match, MatchStatus, Task } from '../types';

import { Users, User, Sparkles, Loader2, Phone, Search, MapPin, Briefcase, Ruler, Heart, X, ArrowUpDown, Kanban, LayoutGrid, Star, Save, Plus, Tag, CheckSquare, FileText, Check, Trash2, Copy, Activity, Bell, Clock, Square, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Upload, Zap, Mail, MessageCircle, Send, Settings, Menu, LogOut, Calendar, GraduationCap } from 'lucide-react';
import MatchPipeline from './MatchPipeline';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/dataService';
import { useToast } from './ToastSystem';
import { Skeleton } from './Skeleton';
import { Confetti } from './Confetti';
import { supabase } from '../services/supabaseClient';

interface ShadchanDashboardProps {
  profiles: Profile[];
  onUpdateProfile: (p: Profile) => void;
  onDeleteProfiles: (ids: string[]) => void;
  onLogout: () => void;
  shadchanProfile?: any;
  onUpdateShadchan?: (profile: any) => void;
}

interface ActivityLog {
  id: string;
  type: 'MATCH_NEW' | 'MATCH_STATUS' | 'PROFILE_NEW' | 'NOTE_ADDED' | 'EXPORT_DATA';
  description: string;
  timestamp: number;
  shadchanId?: number;
  metadata?: any;
}

type SortOption = 'newest' | 'oldest' | 'age_asc' | 'age_desc' | 'name_asc' | 'name_desc';
type DashboardView = 'overview' | 'profiles' | 'pipeline' | 'tasks' | 'settings' | 'messages';

const ShadchanDashboard: React.FC<ShadchanDashboardProps> = ({ profiles: allProfiles, onUpdateProfile, onDeleteProfiles, onLogout, shadchanProfile: initialShadchan, onUpdateShadchan }) => {
  // Filter profiles based on Shadchan assignment
  const profiles = initialShadchan
    ? allProfiles.filter(p => !p.assignedShadchanId || p.assignedShadchanId === initialShadchan.id)
    : allProfiles;
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.MALE);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);

  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  // Messages State
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [idsWithMessages, setIdsWithMessages] = useState<string[]>([]);
  const [dynamicInsights, setDynamicInsights] = useState<any[]>([]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  /* New state for detailed unread counts */
  const [unreadCountsByUser, setUnreadCountsByUser] = useState<Record<string, number>>({});

  const fetchUnreadCount = async () => {
    try {
      // Get global count
      const count = await api.getUnreadMessagesCount();
      setUnreadCount(count);

      // Get count per user (we need a new API method or just do a grouping query here if possible, 
      // but sticking to existing patterns, we might need to fetch all unread messages and group them locally
      // or add a specific RPC/query. For now, let's fetch all unread 'FROM_CANDIDATE' messages and group them.)

      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('profile_id')
        .eq('direction', 'FROM_CANDIDATE')
        .eq('is_read', false);

      if (unreadMsgs) {
        const counts: Record<string, number> = {};
        unreadMsgs.forEach((msg: any) => {
          counts[msg.profile_id] = (counts[msg.profile_id] || 0) + 1;
        });
        setUnreadCountsByUser(counts);
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to all new messages for real-time notifications/updates
    const channel = supabase
      .channel('shadchan-messages-all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          fetchUnreadCount();
          // If we are viewing a profile and a new message comes for it, reload
          if (currentView === 'messages' && chatProfile && payload.new.profile_id === chatProfile.id) {
            loadMessages(chatProfile.id);
          } else {
            // Create a notification if we are not actively chatting with this person
            const sender = profiles.find(p => p.id === payload.new.profile_id);
            if (sender) {
              api.createNotification({
                profileId: payload.new.profile_id,
                type: 'MESSAGE_NEW',
                content: `Nouveau message de ${sender.firstName}: "${payload.new.content.substring(0, 50)}..."`
              }).catch(console.error);
            }
          }
          // Also update the list of IDs with messages if it's a new one
          if (!idsWithMessages.includes(payload.new.profile_id)) {
            setIdsWithMessages(prev => [...prev, payload.new.profile_id]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        async (payload) => {
          // Update local profiles list when a profile changes (e.g. assignment)
          if (payload.new) {
            // Fetch the full profile to ensure consistent structure or use payload if sufficient
            // Since payload might be partial or raw DB format, mapping is safer.
            // For now, let's just update the fields we know are critical like assigned_shadchan_id
            const updatedFields = payload.new;

            // We need to update 'allProfiles' effectively (via onUpdateProfile prop or internal state if we had it exposed... 
            // actually 'profiles' prop is passed from App.tsx/DataService. we can call onUpdateProfile to bubble it up)

            // Construct a partial profile object safely
            const partialUpdate: any = {
              id: updatedFields.id,
              assignedShadchanId: updatedFields.assigned_shadchan_id,
              //... other fields might be needed if they changed 
            };

            onUpdateProfile(partialUpdate);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentView, chatProfile, idsWithMessages]);

  useEffect(() => {
    if (currentView === 'messages') {
      api.getProfileIdsWithMessages().then(setIdsWithMessages).catch(console.error);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'messages' && chatProfile) {
      loadMessages(chatProfile.id);
      api.markMessagesAsRead(chatProfile.id).then(() => fetchUnreadCount());
      // Refresh list of IDs with messages after viewing/sending?
      if (!idsWithMessages.includes(chatProfile.id)) {
        setIdsWithMessages(prev => [...prev, chatProfile.id]);
      }
    }
  }, [currentView, chatProfile]);

  const loadMessages = async (pid: string) => {
    try {
      const msgs = await api.getMessages(pid);
      setMessages(msgs || []);

      // Mark as read if we are opening it
      if (msgs && msgs.some((m: any) => !m.isRead && m.direction === 'FROM_CANDIDATE')) {
        api.markMessagesAsRead(pid).then(() => {
          // Update local count state to remove badge immediately
          fetchUnreadCount();
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !chatProfile) return; // Using newMessageText and chatProfile as per original code
    setSendingMessage(true);
    try {
      await api.sendMessage({
        profileId: chatProfile.id,
        direction: 'FROM_SHADCHAN',
        content: newMessageText
      });

      // Auto-assign shadchan if candidate is unassigned
      if (shadchanProfile?.id) {
        const candidate = profiles.find(p => p.id === chatProfile.id); // Use chatProfile.id
        if (candidate && !candidate.assignedShadchanId) {
          await api.updateProfile({ ...candidate, assignedShadchanId: shadchanProfile.id });
          // Update local state to reflect assignment
          onUpdateProfile({ ...candidate, assignedShadchanId: shadchanProfile.id });
        }
      }

      setNewMessageText(''); // Using setNewMessageText
      loadMessages(chatProfile.id); // Using chatProfile.id
    } catch (err) {
      console.error(err);
      showError("Erreur lors de l'envoi"); // Changed error message to match new snippet
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Matches State
  const [matches, setMatches] = useState<Match[]>([]);

  // Advanced Filters State
  const [selectedReligiousLevel, setSelectedReligiousLevel] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOnlyMyCandidates, setShowOnlyMyCandidates] = useState(false);

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tasks State
  // tasks and newTaskText are already defined below

  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  // Activity Feed State
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Real-time Refs
  const chatProfileRef = useRef<Profile | null>(null);

  // Sync Ref
  useEffect(() => {
    chatProfileRef.current = chatProfile;
  }, [chatProfile]);

  // Real-time Subscriptions
  useEffect(() => {
    const channel = supabase.channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;

          // 1. Update Messages if chat is open
          if (chatProfileRef.current && newMsg.profile_id === chatProfileRef.current.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                id: newMsg.id,
                profileId: newMsg.profile_id,
                direction: newMsg.direction,
                content: newMsg.content,
                createdAt: newMsg.created_at,
                isRead: newMsg.is_read
              }];
            });

            // Mark read locally if we are the recipient and viewing it
            if (newMsg.direction === 'FROM_CANDIDATE') {
              // Could trigger API mark read here, but keeping it simple for now
            }
          }

          // 2. Update Unread Count & Sidebar indicators
          if (newMsg.direction === 'FROM_CANDIDATE') {
            // Only increment if not currently viewing the chat (or assume backend handles 'read' status later)
            if (!chatProfileRef.current || chatProfileRef.current.id !== newMsg.profile_id) {
              setUnreadCount(prev => prev + 1);
              success(`Nouveau message de ${profiles.find(p => p.id === newMsg.profile_id)?.firstName || 'Candidat'}`);
            }

            setIdsWithMessages(prev => {
              if (prev.includes(newMsg.profile_id)) return prev;
              return [...prev, newMsg.profile_id];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          const mapped = {
            id: newNotif.id,
            profileId: newNotif.profile_id,
            type: newNotif.type,
            content: newNotif.content,
            read: newNotif.read,
            createdAt: newNotif.created_at
          };
          setNotifications(prev => [mapped, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profiles]); // Re-subscribe if profiles list changes (rare but ensures name lookup works)

  const sanitize = (text: string) => {
    if (!text) return '';
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/on\w+="[^"]*"/gim, "")
      .replace(/javascript:[^"]*/gim, "");
  };

  const logActivity = (type: ActivityLog['type'], description: string, metadata?: any) => {
    const newActivity: ActivityLog = {
      id: uuidv4(),
      type,
      description: sanitize(description),
      timestamp: Date.now(),
      shadchanId: shadchanProfile?.id,
      metadata
    };
    // Optimistic Update
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
    // API Call
    api.logActivity(newActivity).catch(console.error);
  };

  // Helper to format activity description
  const formatActivityDescription = (description: string) => {
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
    return description.replace(uuidRegex, (match) => {
      const profile = profiles.find(p => p.id === match);
      return profile ? `${profile.firstName} ${profile.lastName}` : match.substring(0, 8) + '...';
    });
  };

  // Task Manager State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [modalTaskText, setModalTaskText] = useState('');
  const [modalAction, setModalAction] = useState<'task' | 'profile_note'>('task');

  const [isUploading, setIsUploading] = useState(false);
  // Shadchan Profile State
  const [shadchanProfile, setShadchanProfile] = useState<any>(initialShadchan || {});
  const [shadchans, setShadchans] = useState<any[]>([]);

  // Templates Data
  // Content Modals State


  // Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, tasksData, activitiesData, shadchanData, allShadchans, notifsData] = await Promise.all([
          api.getMatches(),
          api.getTasks(),
          api.getActivities(),
          initialShadchan?.id ? api.getShadchanProfile(initialShadchan.id) : Promise.resolve(initialShadchan),
          api.getShadchans(),
          api.getNotifications()
        ]);

        // Filter Matches
        const relevantMatches = shadchanData
          ? matchesData.filter((m: Match) =>
            m.createdById === shadchanData.id ||
            // Also include matches where one of the candidates is assigned to this shadchan
            profiles.some(p => p.id === m.boyId && p.assignedShadchanId === shadchanData.id) ||
            profiles.some(p => p.id === m.girlId && p.assignedShadchanId === shadchanData.id)
          )
          : matchesData;

        // Filter Tasks
        const relevantTasks = shadchanData
          ? tasksData.filter((t: any) => t.shadchan_id === shadchanData.id)
          : tasksData;

        setMatches(relevantMatches);
        setTasks(relevantTasks);
        setActivities(activitiesData || []);

        if (shadchanData) {
          setShadchanProfile(shadchanData);
          // Sync fresh data back to parent/storage
          if (onUpdateShadchan) onUpdateShadchan(shadchanData);
        }

        setShadchans(allShadchans || []);
        setNotifications(notifsData || []);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateCompletionScore = (p: Profile) => {
    const fields = [
      'firstName', 'lastName', 'birthDate', 'city', 'occupation', 'height',
      'aboutMe', 'lookingFor', 'contactPhone', 'educationalPath',
      'familyBackground', 'religiousLevel', 'imageUrl'
    ];
    const filled = fields.filter(f => !!(p as any)[f]).length;
    return Math.round((filled / fields.length) * 100);
  };
  const calculateInsights = () => {
    const insights = [];
    const stagnantCount = matches.filter(m =>
      m.status !== MatchStatus.ENGAGED &&
      m.status !== MatchStatus.DROPPED &&
      (Date.now() - (m.lastUpdated || 0) > 5 * 24 * 60 * 60 * 1000)
    ).length;

    if (stagnantCount > 0) {
      insights.push({
        id: 'stagnant',
        type: 'HEALTH',
        text: `${stagnantCount} match(s) stagnant(s) depuis plus de 5 jours.`,
        detail: 'Il est temps de relancer les candidats ou de changer de stratégie.'
      });
    }

    // Check for profile quality
    const lowQualityCount = profiles.filter(p => calculateCompletionScore(p) < 40).length;
    if (lowQualityCount > 0) {
      insights.push({
        id: 'quality',
        type: 'QUALITY',
        text: `${lowQualityCount} profil(s) incomplet(s) détecté(s).`,
        detail: 'Complétez les informations pour améliorer les suggestions IA.'
      });
    }

    // Find potential matches for favorites
    const favorites = profiles.filter(p => p.isFavorite).slice(0, 2);
    favorites.forEach(fav => {
      insights.push({
        id: `suggest-${fav.id}`,
        type: 'SUGGESTION',
        text: `Nouvelle opportunité pour ${fav.firstName}.`,
        detail: `L'IA a identifié 3 profils compatibles avec ses critères.`
      });
    });

    setDynamicInsights(insights);
  };

  useEffect(() => {
    if (matches.length > 0) calculateInsights();
  }, [matches, profiles]);
  useEffect(() => {
    // Subscribe to notifications
    const notifChannel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 50));
          success("Nouvelle notification reçue");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
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

  // Helper to normalize city names
  const normalizeCity = (city: string) => city?.trim().toUpperCase().replace(/[-_]/g, ' ') || '';

  // Extract unique cities from profiles
  const uniqueCities = Array.from(new Set(profiles.map(p => normalizeCity(p.city)))).filter(Boolean).sort();
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
      const profileString = [
        p.firstName, p.lastName, p.age, p.city, p.occupation, p.religiousLevel,
        p.educationalPath, p.community, p.ravKehila, p.ravYeshiva,
        p.yeshivaKtana, p.yeshivaGdola, p.isSmoking, p.aboutMe, p.lookingFor,
        p.familyBackground, p.contactPhone, ...(p.tags || [])
      ].filter(Boolean).join(' ').toLowerCase();

      const searchTerms = searchQuery.toLowerCase().split(' ').filter(Boolean);
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => profileString.includes(term));
      const matchesReligion = selectedReligiousLevel ? p.religiousLevel === selectedReligiousLevel : true;
      const matchesCity = selectedCity ? normalizeCity(p.city) === selectedCity : true;
      const matchesFavorite = showFavoritesOnly ? p.isFavorite : true;
      const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;
      const matchesMyCandidates = showOnlyMyCandidates ? p.assignedShadchanId === shadchanProfile?.id : true;

      // Exclusivity filter: hide profiles that are in a non-archived match (regardless of creator)
      // We removed this to let Shadchan see matched candidates
      /*
      const isExclusivelyMatched = matches.some(m =>
        (m.boyId === p.id || m.girlId === p.id) &&
        m.status !== MatchStatus.ARCHIVED &&
        m.status !== MatchStatus.DROPPED
      );
      */

      return matchesGender && matchesSearch && matchesReligion && matchesCity && matchesFavorite && matchesTag && matchesMyCandidates;
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
      const boy = profiles.find(p => p.id === match.boyId);
      const girl = profiles.find(p => p.id === match.girlId);
      const description = `Statut mis à jour pour le match ${boy?.firstName || match.boyId}/${girl?.firstName || match.girlId}: ${newStatus}`;
      logActivity('MATCH_STATUS', description);

      // For meeting/dating, we might show a confetti if it's a first meeting!
      if (newStatus === MatchStatus.DATING) {
        api.createNotification({
          type: 'MATCH_ALERT',
          content: `Étape importante ! ${boy?.firstName} & ${girl?.firstName} sont maintenant en état: ${newStatus}`
        }).catch(console.error);
      }
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    // Optimistic update
    const matchToDelete = matches.find(m => m.id === matchId);
    setMatches(prev => prev.filter(m => m.id !== matchId));

    try {
      await api.deleteMatch(matchId);
      success("Match supprimé définitivement.");

      // Log activity
      if (matchToDelete) {
        const boy = profiles.find(p => p.id === matchToDelete.boyId);
        const girl = profiles.find(p => p.id === matchToDelete.girlId);
        logActivity('MATCH_STATUS', `Match supprimé entre ${boy?.firstName} et ${girl?.firstName}`);
      }
    } catch (err) {
      console.error(err);
      showError("Erreur lors de la suppression du match.");
      // Revert
      if (matchToDelete) {
        setMatches(prev => [...prev, matchToDelete]);
      }
    }
  };

  const createMatchFromSuggestion = (candidateProfile: Profile, reasoning: string) => {
    if (!selectedProfile) return;

    // Determine who is who based on gender (convention: boyId, girlId)
    const boyId = selectedProfile.gender === Gender.MALE ? selectedProfile.id : candidateProfile.id;
    const girlId = selectedProfile.gender === Gender.FEMALE ? selectedProfile.id : candidateProfile.id;

    // Check for active matches to enforce exclusivity
    const boyActiveMatch = matches.find(m =>
      (m.boyId === boyId || m.girlId === boyId) &&
      m.status !== MatchStatus.ARCHIVED &&
      m.status !== MatchStatus.DROPPED
    );
    if (boyActiveMatch) {
      alert("Le candidat est déjà dans un match actif.");
      return;
    }

    const girlActiveMatch = matches.find(m =>
      (m.boyId === girlId || m.girlId === girlId) &&
      m.status !== MatchStatus.ARCHIVED &&
      m.status !== MatchStatus.DROPPED
    );
    if (girlActiveMatch) {
      alert("La candidate est déjà dans un match actif.");
      return;
    }

    // Check if match already exists (same pair)
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
      lastUpdated: Date.now(),
      createdById: shadchanProfile?.id || 1
    };

    setMatches(prev => [...prev, newMatch]);
    api.saveMatch(newMatch).then(() => {
      // Auto-assign candidates to this shadchan if they were unassigned
      // This prevents them from showing up as "Unassigned" for other shadchanim
      if (shadchanProfile?.id) {
        const boy = profiles.find(p => p.id === boyId);
        const girl = profiles.find(p => p.id === girlId);

        if (boy && !boy.assignedShadchanId) {
          api.updateProfile({ ...boy, assignedShadchanId: shadchanProfile.id });
          onUpdateProfile({ ...boy, assignedShadchanId: shadchanProfile.id });
        }
        if (girl && !girl.assignedShadchanId) {
          api.updateProfile({ ...girl, assignedShadchanId: shadchanProfile.id });
          onUpdateProfile({ ...girl, assignedShadchanId: shadchanProfile.id });
        }
      }
    }).catch(console.error);

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



  const handleManualMatchSubmit = () => {
    if (!manualMatchBoyId || !manualMatchGirlId) {
      alert("Veuillez sélectionner un homme et une femme.");
      return;
    }
    const checkAvailability = () => {
      const boyActiveMatch = matches.find(m =>
        (m.boyId === manualMatchBoyId || m.girlId === manualMatchBoyId) &&
        m.status !== MatchStatus.ARCHIVED &&
        m.status !== MatchStatus.DROPPED
      );
      if (boyActiveMatch) return "Le candidat (Homme) est déjà dans un match actif.";

      const girlActiveMatch = matches.find(m =>
        (m.boyId === manualMatchGirlId || m.girlId === manualMatchGirlId) &&
        m.status !== MatchStatus.ARCHIVED &&
        m.status !== MatchStatus.DROPPED
      );
      if (girlActiveMatch) return "La candidate (Femme) est déjà dans un match actif.";

      return null;
    };

    const availabilityError = checkAvailability();
    if (availabilityError) {
      alert(availabilityError);
      return;
    }

    // Legacy check for exact duplicate (covered by above but kept for safety/clarity if needed, though availability check is stricter)
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
      lastUpdated: Date.now(),
      createdById: shadchanProfile?.id || 1
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

  const handleModalSave = () => {
    if (modalAction === 'task') {
      handleAddTask(modalTaskText);
    } else if (modalAction === 'profile_note') {
      if (selectedProfile && onUpdateProfile) {
        const updated = { ...selectedProfile, privateNotes: modalTaskText };
        onUpdateProfile(updated);
        setSelectedProfile(updated);
        setNoteBuffer(modalTaskText);
        success("Notes sauvegardées");
        setShowAddTaskModal(false);
        setModalTaskText('');
      }
    }
  };

  // Task Handlers
  const handleAddTask = (textSource?: string) => {
    const text = textSource || taskInputRef.current?.value || '';


    if (!text.trim()) {

      setShowAddTaskModal(true);
      return;
    }

    const taskId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${Math.random()}`;

    const newTask: Task = {
      id: taskId,
      text: text,
      completed: false,
      createdAt: Date.now(),
      shadchan_id: shadchanProfile?.id
    };

    // Optimistic update
    setTasks(prev => [newTask, ...prev]);

    // Clear inputs
    if (taskInputRef.current) taskInputRef.current.value = '';
    setModalTaskText('');
    setShowAddTaskModal(false);

    api.createTask(newTask)
      .then(() => {
        success("Note ajoutée");
        logActivity('NOTE_ADDED', `Nouvelle note: ${text.substring(0, 30)}...`);
      })
      .catch(err => {
        console.error("Failed to create task in API:", err);
        showError("Erreur lors de la sauvegarde");
        setTasks(prev => prev.filter(t => t.id !== newTask.id));
      });
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

  const getLastSeenText = (timestamp?: number) => {
    if (!timestamp) return { text: "Hors ligne", color: "text-wedding-navy/40", active: false };
    const diff = Date.now() - timestamp;
    if (diff < 5 * 60 * 1000) return { text: "En ligne", color: "text-green-600", active: true };
    if (diff < 60 * 60 * 1000) return { text: `Il y a ${Math.floor(diff / 60000)} min`, color: "text-wedding-navy/60", active: false };
    if (diff < 24 * 60 * 60 * 1000) return { text: `Il y a ${Math.floor(diff / 3600000)} h`, color: "text-wedding-navy/60", active: false };
    return { text: new Date(timestamp).toLocaleDateString(), color: "text-wedding-navy/40", active: false };
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

  const hasActiveFilters = searchQuery || selectedReligiousLevel || selectedCity || showFavoritesOnly;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-wedding-gold" />
          <p className="text-wedding-navy text-sm font-medium tracking-widest uppercase animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-transparent font-sans text-wedding-navy overflow-hidden print:h-auto print:block relative">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:relative inset-y-0 left-0 ${isSidebarCollapsed ? 'w-20' : 'w-60'} bg-wedding-navy flex flex-col shrink-0 z-50 transition-all duration-500 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} print:hidden`}>
        {/* Toggle Button (Desktop) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-5 -right-3 w-6 h-6 bg-wedding-gold text-wedding-navy rounded-full items-center justify-center z-50 shadow-md hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -right-24 w-48 h-48 bg-wedding-rose rounded-full blur-[80px]"></div>
        </div>

        {/* Close Button Mobile */}
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo Area - Compact */}
        <div className={`px-6 py-8 flex flex-col ${isSidebarCollapsed ? 'items-center' : 'items-start'} relative z-10 w-full transition-all`}>
          {!isSidebarCollapsed ? (
            <>
              <span className="font-serif font-bold text-lg tracking-widest text-white block leading-none text-nowrap">BINYAN</span>
              <span className="font-serif font-bold text-lg tracking-widest text-wedding-gold block leading-none mb-1 text-nowrap">ADEI AD</span>
              <div className="h-0.5 w-8 bg-white/20 rounded-full"></div>
            </>
          ) : (
            <span className="font-serif font-bold text-xl text-wedding-gold">B</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 py-6">
          {!isSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Principal</p>}

          <button onClick={() => { setCurrentView('overview'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'overview' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`} title="Vue d'ensemble">
            <Activity className={`w-5 h-5 transition-colors ${currentView === 'overview' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            {!isSidebarCollapsed && <span className="relative z-10">Vue d'ensemble</span>}
            {currentView === 'overview' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => { setCurrentView('profiles'); setIsMobileSidebarOpen(false); setIsSidebarCollapsed(true); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'profiles' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`} title="Candidats">
            <LayoutGrid className={`w-5 h-5 transition-colors ${currentView === 'profiles' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            {!isSidebarCollapsed && <span className="relative z-10">Candidats</span>}
            {currentView === 'profiles' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => { setCurrentView('pipeline'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'pipeline' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`} title="Pipeline">
            <Kanban className={`w-5 h-5 transition-colors ${currentView === 'pipeline' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            {!isSidebarCollapsed && <span className="relative z-10">Pipeline</span>}
            {currentView === 'pipeline' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          {!isSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 mt-8">Outils</p>}
          {isSidebarCollapsed && <div className="my-4 h-px bg-white/5 mx-2"></div>}

          <button onClick={() => { setCurrentView('tasks'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'tasks' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`} title="Notes">
            <CheckSquare className={`w-5 h-5 transition-colors ${currentView === 'tasks' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
            {!isSidebarCollapsed && <span className="relative z-10">Notes</span>}
            {currentView === 'tasks' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <button onClick={() => { setCurrentView('messages'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-300 text-xs font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'messages' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`} title="Messagerie">
            <div className="relative">
              <MessageCircle className={`w-5 h-5 transition-colors ${currentView === 'messages' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="relative z-10 flex-1 flex items-center justify-between">
                Messagerie
                {unreadCount > 0 && <span className="bg-wedding-gold text-wedding-navy text-[9px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </span>
            )}
            {currentView === 'messages' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-wedding-gold rounded-r-full"></div>}
          </button>

          <div className="mt-auto space-y-2">
            <button onClick={() => { setCurrentView('settings'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-5'} py-3 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-widest uppercase group relative overflow-hidden ${currentView === 'settings' ? 'bg-white text-wedding-navy shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`} title="Paramètres">
              <Settings className={`w-4 h-4 transition-colors ${currentView === 'settings' ? 'text-wedding-navy' : 'text-wedding-gold group-hover:text-white'}`} />
              {!isSidebarCollapsed && <span className="relative z-10">Paramètres</span>}
              {currentView === 'settings' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-wedding-gold rounded-r-full"></div>}
            </button>

            <button onClick={onLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-5'} py-3 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-widest uppercase text-white/40 hover:text-red-300 hover:bg-white/5 group`} title="Déconnexion">
              <LogOut className="w-4 h-4 text-wedding-gold group-hover:text-red-300 transition-colors" />
              {!isSidebarCollapsed && <span className="relative z-10">Déconnexion</span>}
            </button>
          </div>
        </nav>

        {!isSidebarCollapsed && (
          <div className="px-6 py-4 flex flex-col items-start gap-1 relative z-10 opacity-20">
            <div className="text-[8px] font-bold text-white uppercase tracking-[0.3em]">v2.1</div>
          </div>
        )}
      </aside>

      {/* Overlay mobile */}
      {
        isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-wedding-navy/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )
      }

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="glass-nav h-16 sm:h-20 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xl shadow-wedding-navy/5 z-20 print:hidden mx-4 sm:mx-6 mt-4 rounded-2xl border border-white/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-wedding-navy/60 hover:text-wedding-navy transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-serif font-bold text-lg sm:text-2xl text-wedding-navy flex items-center gap-2 md:gap-3">
              {currentView === 'overview' && <><Activity className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Vue d'Ensemble</span><span className="xs:hidden">Vue</span></>}
              {currentView === 'profiles' && <><LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Base Candidats</span><span className="xs:hidden">Candidats</span></>}
              {currentView === 'pipeline' && <><Kanban className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Pipeline</span><span className="xs:hidden">Pipeline</span></>}
              {currentView === 'tasks' && <><CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Notes</span><span className="xs:hidden">Notes</span></>}
              {currentView === 'messages' && <><MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Messagerie</span><span className="xs:hidden">Messages</span></>}
              {currentView === 'settings' && <><Settings className="w-5 h-5 md:w-6 md:h-6 text-wedding-gold" /> <span className="hidden xs:inline">Paramètres</span><span className="xs:hidden">Settings</span></>}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className={`p-3 rounded-xl transition-all relative group ${showNotificationCenter ? 'bg-wedding-navy text-wedding-gold shadow-xl' : 'text-wedding-navy/40 hover:text-wedding-navy hover:bg-wedding-navy/5'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationCenter && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotificationCenter(false)} />
                  <div className="absolute right-0 mt-4 w-80 md:w-96 glass-card border-wedding-navy/5 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-wedding-navy text-wedding-gold flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest">Notifications</h3>
                      <div className="flex gap-3">
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={handleMarkAllNotificationsRead}
                            className="text-[9px] font-bold uppercase tracking-tighter hover:underline"
                          >
                            Tout marquer lu
                          </button>
                        )}
                        <button onClick={() => setShowNotificationCenter(false)} className="hover:text-white transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center opacity-40">
                          <Bell className="w-10 h-10 mx-auto mb-3" />
                          <p className="text-[10px] font-bold tracking-widest uppercase">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className={`p-4 border-b border-wedding-navy/5 cursor-pointer transition-colors hover:bg-wedding-navy/5 flex gap-4 ${!notif.read ? 'bg-wedding-gold/5' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-wedding-gold' : 'bg-transparent'}`}></div>
                            <div>
                              <p className="text-[11px] font-bold text-wedding-navy mb-1 leading-tight">{notif.content}</p>
                              <p className="text-[9px] font-medium text-wedding-navy/40 uppercase tracking-widest">{new Date(notif.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowManualMatchModal(true)}
              className="bg-wedding-gold text-wedding-navy px-3 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg hover:shadow-wedding-gold/20 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Nouveau Match</span><span className="sm:hidden">Match</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-3 md:p-6">



          {
            currentView === 'pipeline' && (
              <div className="flex-1 overflow-hidden">
                <MatchPipeline
                  matches={matches} // Filter out suppressed/deleted if needed, but matches state is already updated
                  profiles={profiles}
                  onUpdateStatus={handleUpdateMatchStatus}
                  onDeleteMatch={handleDeleteMatch}
                  onViewProfile={(profile) => {
                    setSelectedProfile(profile);
                    setCurrentView('profiles');
                  }}
                />
              </div>
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
                      ref={taskInputRef}
                      placeholder="AJOUTER UNE NOUVELLE NOTE..."
                      className="flex-1 px-6 py-4 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 focus:ring-4 focus:ring-wedding-gold/5 transition-all font-bold text-xs uppercase tracking-widest text-wedding-navy placeholder:text-wedding-navy/20 shadow-inner"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <button
                      onClick={() => {
                        if (!taskInputRef.current?.value.trim()) {
                          setModalAction('task');
                          setShowAddTaskModal(true);
                        } else {
                          handleAddTask();
                        }
                      }}
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
                      [...tasks].sort((a, b) => b.createdAt - a.createdAt).map(task => (
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
                          .then(() => {
                            success('Profil sauvegardé avec succès');
                            if (onUpdateShadchan) {
                              onUpdateShadchan(shadchanProfile);
                            }
                          })
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

                {/* Information Reminder Banner */}
                {!(shadchanProfile?.name && shadchanProfile.name !== 'Votre Nom' && !shadchanProfile.name.toLowerCase().includes('votre nom') &&
                  shadchanProfile?.bio && shadchanProfile.bio !== 'Biographie...' &&
                  shadchanProfile?.phone && shadchanProfile?.email) && (
                    <div className="mb-8 p-6 bg-wedding-gold/10 border border-wedding-gold/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-wedding-gold/5 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-wedding-gold text-wedding-navy rounded-2xl shadow-lg">
                          <Settings className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-wedding-navy uppercase tracking-widest">Informations Incomplètes</h3>
                          <p className="text-xs text-wedding-navy/60 font-medium mt-1">
                            Pensez à compléter vos informations (Nom, Bio, Téléphone, Email) dans les <span className="text-wedding-navy font-bold">Paramètres</span>.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('settings')}
                        className="w-full md:w-auto px-6 py-3 bg-wedding-navy text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-opacity-95 transition-all active:scale-95 shadow-lg border border-wedding-gold/20 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-wedding-gold" />
                        Compléter mon profil
                      </button>
                    </div>
                  )}

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

                <div className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-xl text-wedding-navy flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-wedding-gold" />
                      Nouveaux Candidats
                    </h3>
                    <button onClick={() => setCurrentView('profiles')} className="text-[10px] font-bold uppercase tracking-widest text-wedding-navy/40 hover:text-wedding-navy transition-colors">
                      Voir tout
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[...profiles].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5).map(p => (
                      <div key={p.id} onClick={() => { setSelectedProfile(p); setCurrentView('profiles'); }} className="glass-card p-4 rounded-xl border-wedding-navy/5 shadow-lg shadow-wedding-navy/5 hover:border-wedding-gold/30 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full mb-3 p-1 border border-wedding-navy/5 group-hover:border-wedding-gold/50 transition-colors">
                            {p.imageUrl ?
                              <img src={p.imageUrl} alt={p.firstName} className="w-full h-full rounded-full object-cover" />
                              : <div className="w-full h-full rounded-full bg-wedding-navy/5 flex items-center justify-center text-wedding-navy font-serif font-bold text-lg">{p.firstName.charAt(0)}</div>
                            }
                          </div>
                          <h4 className="font-bold text-wedding-navy text-sm mb-0.5">{p.firstName} {p.lastName}</h4>
                          <p className="text-[10px] text-wedding-text/50 font-bold uppercase tracking-wide mb-2">{p.age} ans • {p.city}</p>
                          <div className="text-[9px] bg-wedding-navy/5 text-wedding-navy/60 px-2 py-1 rounded-md font-bold">
                            {p.religiousLevel}
                          </div>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && (
                      <div className="col-span-full text-center py-8 text-wedding-navy/30 italic text-sm">
                        Aucun candidat récent
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  {/* Recent Activity - Full Width */}
                  <div className="glass-card rounded-2xl p-8 border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5 flex flex-col h-[500px] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                      <h3 className="font-serif font-bold text-xl text-wedding-navy flex items-center gap-3">
                        <Activity className="w-5 h-5 text-wedding-gold" />
                        Journal d'Activité
                      </h3>
                      <div className="text-[9px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] px-2 py-1 bg-wedding-navy/5 rounded-md">
                        Temps Réel
                      </div>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-10 relative z-10">
                      {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                          <Clock className="w-10 h-10 mb-4" />
                          <p className="text-sm">Aucun événement récent.</p>
                        </div>
                      ) : (
                        activities.map(act => (
                          <div key={act.id} className="flex gap-4 p-4 rounded-xl hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-wedding-navy/5 hover:shadow-sm">
                            <div className={`mt-2 w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform duration-300 ${act.type === 'MATCH_NEW' ? 'bg-wedding-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' :
                              act.type === 'MATCH_STATUS' ? 'bg-wedding-navy' :
                                act.type === 'PROFILE_NEW' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                                  'bg-wedding-navy/20'
                              }`} />
                            <div className="flex-1">
                              <p className="text-wedding-navy text-sm font-semibold leading-relaxed group-hover:text-wedding-navy/80 transition-colors">
                                {formatActivityDescription(act.description)}
                              </p>
                              <p className="text-[9px] text-wedding-text/40 font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Clock className="w-2.5 h-2.5" /> <span className="pt-0.5">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Gradient Fade at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none z-20 rounded-b-2xl"></div>
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

                    {/* Search & Filters Container */}
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-wedding-gold group-focus-within:scale-110 transition-transform duration-300" />
                        </div>
                        <input
                          type="text"
                          placeholder="Rechercher par nom, ville, ou tag..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3.5 bg-white border border-wedding-navy/5 rounded-xl text-sm font-medium text-wedding-navy placeholder:text-wedding-navy/30 focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 focus:border-wedding-gold/40 transition-all shadow-sm hover:shadow-md"
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                          {/* Favorites Toggle */}
                          <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`p-2 rounded-lg transition-all duration-300 ${showFavoritesOnly ? 'bg-wedding-gold/10 text-wedding-gold' : 'text-wedding-navy/20 hover:text-wedding-gold hover:bg-wedding-gold/5'}`}
                            title="Afficher les favoris uniquement"
                          >
                            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                          </button>
                          {/* Privacy Toggle */}
                          <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className={`p-2 rounded-lg transition-all duration-300 ${privacyMode ? 'bg-wedding-navy text-white' : 'text-wedding-navy/20 hover:text-wedding-navy hover:bg-wedding-navy/5'}`}
                            title="Mode Confidentiel"
                          >
                            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {/* My Candidates Toggle */}
                          <button
                            onClick={() => setShowOnlyMyCandidates(!showOnlyMyCandidates)}
                            className={`p-2 rounded-lg transition-all duration-300 ${showOnlyMyCandidates ? 'bg-indigo-100 text-indigo-600' : 'text-wedding-navy/20 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            title="Mes Candidats Uniquement"
                          >
                            <User className={`w-4 h-4 ${showOnlyMyCandidates ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Filters Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={selectedReligiousLevel}
                          onChange={(e) => setSelectedReligiousLevel(e.target.value)}
                          className="block w-full py-2.5 px-3 bg-white border border-wedding-navy/5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider text-wedding-navy focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 transition-all cursor-pointer shadow-sm hover:border-wedding-gold/30 appearance-none"
                        >
                          <option value="">Hashkafa...</option>
                          {Object.values(ReligiousLevel).map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="block w-full py-2.5 px-3 bg-white border border-wedding-navy/5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider text-wedding-navy focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 transition-all cursor-pointer shadow-sm hover:border-wedding-gold/30 appearance-none"
                        >
                          <option value="">Ville...</option>
                          {uniqueCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
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
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-300 group relative border flex items-center gap-4 ${selectedProfile?.id === profile.id
                            ? 'bg-wedding-navy text-white shadow-xl shadow-wedding-navy/30 border-wedding-navy scale-[1.02] ring-1 ring-wedding-navy'
                            : 'bg-white hover:bg-white/80 text-wedding-navy border-transparent hover:border-wedding-gold/30 hover:shadow-lg'
                            }`}
                        >
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => toggleProfileSelection(profile.id, e)}
                            className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors z-10 ${selectedProfileIds.includes(profile.id) ? 'text-wedding-gold bg-wedding-navy shadow-md' : 'text-wedding-navy/10 hover:text-wedding-gold'}`}
                          >
                            {selectedProfileIds.includes(profile.id) ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Square className="w-5 h-5" />}
                          </div>

                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-serif font-bold shrink-0 overflow-hidden shadow-md border-2 ${selectedProfile?.id === profile.id ? 'border-white/20 bg-white/10 text-white' : 'border-white bg-wedding-navy/5 text-wedding-navy'}`}>
                            {profile.imageUrl ? (
                              <img src={profile.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              profile.firstName.charAt(0)
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className={`font-serif font-bold text-base truncate leading-snug ${selectedProfile?.id === profile.id ? 'text-white' : 'text-wedding-navy'}`}>
                              {privacyMode ? `${profile.firstName} ${profile.lastName.charAt(0)}.` : `${profile.firstName} ${profile.lastName}`}
                            </h3>
                            <div className={`flex items-center gap-2 mt-1 text-[9px] font-bold uppercase tracking-widest ${selectedProfile?.id === profile.id ? 'text-white/60' : 'text-wedding-navy/40'}`}>
                              {(() => {
                                const lastActive = profile.lastActiveAt || 0;
                                const diff = Date.now() - lastActive;
                                let statusText = 'Hors ligne';
                                let statusColor = 'bg-slate-300';

                                if (lastActive > 0) {
                                  if (diff < 5 * 60 * 1000) {
                                    statusText = 'En ligne';
                                    statusColor = 'bg-green-500';
                                  } else if (diff < 60 * 60 * 1000) {
                                    statusText = `${Math.floor(diff / 60000)} min`;
                                    statusColor = 'bg-amber-400';
                                  } else if (diff < 24 * 3600000) {
                                    statusText = `${Math.floor(diff / 3600000)} h`;
                                    statusColor = 'bg-slate-400';
                                  } else {
                                    statusText = new Date(lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                  }
                                }

                                return (
                                  <div className="flex items-center gap-1.5 min-w-[60px]" title={lastActive > 0 ? "Dernière activité: " + new Date(lastActive).toLocaleString() : "Jamais connecté"}>
                                    <div className={`w-2 h-2 rounded-full ${statusColor} ${statusText === 'En ligne' ? 'animate-pulse' : ''} shadow-sm`}></div>
                                    <span>{statusText}</span>
                                    <span className="w-0.5 h-3 bg-current opacity-20 ml-1"></span>
                                  </div>
                                );
                              })()}

                              <span>{profile.age} ANS</span>
                              <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                              <span className="truncate max-w-[80px]">{profile.city}</span>
                            </div>

                            {/* Favorite Indicator (Small) */}
                            {profile.isFavorite && (
                              <div className="absolute bottom-3 right-3">
                                <Star className="w-3 h-3 fill-wedding-gold text-wedding-gold" />
                              </div>
                            )}

                            <div className={`mt-2 flex items-center justify-between`}>
                              <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${selectedProfile?.id === profile.id ? 'bg-wedding-gold text-wedding-navy border-wedding-gold' : 'bg-wedding-navy/5 text-wedding-navy/60 border-wedding-navy/5'}`}>
                                {profile.religiousLevel}
                              </div>
                              <div className={`flex items-center gap-1 text-[8px] font-bold ${selectedProfile?.id === profile.id ? 'text-white/80' : 'text-wedding-navy/40'}`}>
                                <CheckSquare className="w-2.5 h-2.5" />
                                {calculateCompletionScore(profile)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Main Detail View */}
                <div className={`flex-1 glass-card border-wedding-navy/5 overflow-hidden flex flex-col print:shadow-none print:border-none print:h-auto print:overflow-visible relative ${!selectedProfile ? 'hidden lg:flex' : 'flex'}`}>
                  {!selectedProfile && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm">
                      <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl shadow-wedding-gold/20 border-4 border-white ring-1 ring-wedding-navy/5 relative group cursor-pointer hover:scale-105 transition-transform duration-500">
                          <div className="absolute inset-0 bg-wedding-gold/10 rounded-full animate-pulse"></div>
                          <Users className="w-12 h-12 text-wedding-gold relative z-10" />
                          <div className="absolute bottom-0 right-0 p-3 bg-wedding-navy rounded-full text-white shadow-lg transform translate-x-1 translate-y-1">
                            <Search className="w-5 h-5" />
                          </div>
                        </div>

                        <div>
                          <h2 className="text-3xl font-serif font-bold text-wedding-navy mb-3">Sélectionnez un Candidat</h2>
                          <p className="text-wedding-text/60 leading-relaxed font-medium">
                            Cliquez sur un profil dans la liste pour accéder à ses informations détaillées, ses préférences et gérer son parcours de matchmaking.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6">
                          <div className="p-4 bg-white rounded-2xl shadow-sm border border-wedding-navy/5 flex flex-col items-center gap-2 hover:border-wedding-gold/30 transition-colors group">
                            <span className="text-3xl font-serif font-bold text-wedding-navy group-hover:text-wedding-gold transition-colors">{profiles.filter(p => p.gender === Gender.MALE).length}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-wedding-navy/40">Hommes</span>
                          </div>
                          <div className="p-4 bg-white rounded-2xl shadow-sm border border-wedding-navy/5 flex flex-col items-center gap-2 hover:border-wedding-gold/30 transition-colors group">
                            <span className="text-3xl font-serif font-bold text-wedding-navy group-hover:text-wedding-gold transition-colors">{profiles.filter(p => p.gender === Gender.FEMALE).length}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-wedding-navy/40">Femmes</span>
                          </div>
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
                          {selectedProfile.imageUrl ? (
                            <img
                              src={selectedProfile.imageUrl}
                              alt="Profile"
                              className="w-40 h-40 rounded-3xl object-cover shadow-2xl border-4 border-white ring-1 ring-wedding-navy/5 bg-wedding-navy/5"
                            />
                          ) : (
                            <div className="w-40 h-40 rounded-3xl flex items-center justify-center bg-wedding-navy text-wedding-gold shadow-2xl border-4 border-white ring-1 ring-wedding-navy/5">
                              <span className="font-serif font-bold text-6xl">{selectedProfile.firstName.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute -bottom-3 -right-3 p-3 bg-wedding-gold text-wedding-navy rounded-2xl shadow-xl ring-4 ring-white">
                            <Heart className="w-5 h-5 fill-current" />
                          </div>
                        </div>
                        <div className="flex-1 w-full pt-2">
                          <div className="flex flex-wrap justify-between items-start gap-6">
                            <div>
                              <div className="flex items-center gap-4">
                                <h1 className="text-3xl md:text-5xl font-serif font-bold text-wedding-navy mb-2 tracking-tight">{selectedProfile.firstName} {selectedProfile.lastName}</h1>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setModalAction('profile_note');
                                      setModalTaskText(noteBuffer);
                                      setShowAddTaskModal(true);
                                    }}
                                    className="p-2.5 rounded-2xl bg-wedding-gold text-wedding-navy hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
                                    title="Notes Privées"
                                  >
                                    <CheckSquare className="w-5 h-5" />
                                    <span className="text-[12px] font-bold uppercase tracking-widest hidden sm:inline">Notes</span>
                                  </button>
                                  <button onClick={(e) => toggleFavorite(e, selectedProfile)} className={`p-2.5 rounded-2xl transition-all duration-300 shadow-sm ${selectedProfile.isFavorite ? 'text-wedding-navy bg-wedding-gold ring-1 ring-wedding-gold' : 'text-wedding-navy/20 bg-white border border-wedding-navy/5 hover:text-wedding-gold hover:border-wedding-gold'}`}>
                                    <Star className={`w-6 h-6 ${selectedProfile.isFavorite ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-6 mt-4">
                                {(() => {
                                  const lastActive = selectedProfile.lastActiveAt || 0;
                                  const diff = Date.now() - lastActive;
                                  const isOnline = diff < 5 * 60 * 1000;
                                  return (
                                    <span className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'text-green-600' : 'text-wedding-text/60'}`}>
                                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                      {isOnline ? 'En ligne' :
                                        !lastActive ? 'Jamais connecté' :
                                          diff < 60 * 60000 ? `Vu il y a ${Math.floor(diff / 60000)} min` :
                                            diff < 24 * 3600000 ? `Vu il y a ${Math.floor(diff / 3600000)} h` :
                                              `Vu le ${new Date(lastActive).toLocaleDateString()}`}
                                    </span>
                                  );
                                })()}
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

                      {/* Sections Détails Profil */}
                      <div className="space-y-12 mb-12">
                        {/* Section 1: Physique & Caractéristiques */}
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Portrait & Physionomie
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/40 p-5 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Détails Physiques</p>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-wedding-navy flex justify-between">Taille: <span className="font-medium opacity-70">{selectedProfile.height ? `${selectedProfile.height} cm` : 'Non spécifié'}</span></p>
                                <p className="text-sm font-bold text-wedding-navy flex justify-between">Morphologie: <span className="font-medium opacity-70">{selectedProfile.bodyType || 'Non spécifié'}</span></p>
                                <p className="text-sm font-bold text-wedding-navy flex justify-between">Teint: <span className="font-medium opacity-70">{selectedProfile.skinColor || 'Non spécifié'}</span></p>
                                <p className="text-sm font-bold text-wedding-navy flex justify-between">Yeux: <span className="font-medium opacity-70">{selectedProfile.eyeColor || 'Non spécifié'}</span></p>
                                <p className="text-sm font-bold text-wedding-navy flex justify-between">Cheveux: <span className="font-medium opacity-70">{selectedProfile.hairColor || 'Non spécifié'}</span></p>
                              </div>
                            </div>
                            <div className="bg-white/40 p-5 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Tabac</p>
                              <p className="text-sm font-bold text-wedding-navy">{selectedProfile.isSmoking || 'Non spécifié'}</p>
                              {selectedProfile.smokingDetails && <p className="text-xs mt-1 text-wedding-navy/60 italic">{selectedProfile.smokingDetails}</p>}
                            </div>
                            <div className="bg-white/40 p-5 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Santé & Plus</p>
                              <p className="text-xs text-wedding-navy/70 leading-relaxed">{selectedProfile.aboutMe || 'Informations de base...'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Parcours Scolaire & Pro */}
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Éducation & Carrière
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner space-y-4">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Scolarité Traditionnelle</p>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tighter">Primaire</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.primarySchool || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tighter">Collège</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.middleSchool || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tighter">Lycée</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.highSchool || '-'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner space-y-4">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Parcours Yéchiva / Séminaire</p>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tighter">Yéchiva Ktana / Séminaire</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.yeshivaKtana || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tighter">Yéchiva Gdola / Séminaire Avancé</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.yeshivaGdola || '-'}</p>
                                </div>
                                {selectedProfile.educationalPath && (
                                  <div className="pt-2 border-t border-wedding-navy/5">
                                    <p className="text-xs text-wedding-navy/70 leading-relaxed italic">"{selectedProfile.educationalPath}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-2 bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Occupation Actuelle</p>
                                  <p className="text-lg font-serif font-bold text-wedding-navy">{selectedProfile.currentOccupation || selectedProfile.occupation}</p>
                                </div>
                                <div className="flex-1">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Diplômes & Qualifications</p>
                                  <p className="text-sm font-bold text-wedding-navy/80">{selectedProfile.qualifications || 'Non spécifiés'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Personnalité & Style */}
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Personnalité & Style de Vie
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Traits */}
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Caractère</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {selectedProfile.personalTraits?.split(',').filter(v => v).map(trait => (
                                  <span key={trait} className="px-3 py-1 bg-wedding-gold/10 text-wedding-navy rounded-lg text-[10px] font-bold border border-wedding-gold/20">{trait}</span>
                                ))}
                              </div>
                              {selectedProfile.personalTraitsDetails && (
                                <p className="text-xs text-wedding-navy/60 italic leading-relaxed border-t border-wedding-navy/5 pt-2">"{selectedProfile.personalTraitsDetails}"</p>
                              )}
                            </div>
                            {/* Clothing */}
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Style Vestimentaire</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {selectedProfile.personalClothing?.split(',').filter(v => v).map(style => (
                                  <span key={style} className="px-3 py-1 bg-wedding-navy/5 text-wedding-navy rounded-lg text-[10px] font-bold border border-wedding-navy/10">{style}</span>
                                ))}
                              </div>
                              {selectedProfile.personalClothingDetails && (
                                <p className="text-xs text-wedding-navy/60 italic leading-relaxed border-t border-wedding-navy/5 pt-2">"{selectedProfile.personalClothingDetails}"</p>
                              )}
                              {selectedProfile.headCoveringPreference && (
                                <div className="mt-3 pt-3 border-t border-wedding-navy/5">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Couvre-Chef</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.headCoveringPreference}</p>
                                </div>
                              )}
                            </div>
                            {/* Phone */}
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Utilisation Téléphone</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {selectedProfile.personalPhone?.split(',').filter(v => v).map(type => (
                                  <span key={type} className="px-3 py-1 bg-wedding-rose/10 text-wedding-navy rounded-lg text-[10px] font-bold border border-wedding-rose/20">{type}</span>
                                ))}
                              </div>
                              {selectedProfile.personalPhoneDetails && (
                                <p className="text-xs text-wedding-navy/60 italic leading-relaxed border-t border-wedding-navy/5 pt-2">"{selectedProfile.personalPhoneDetails}"</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Vision & recherche */}
                        <div>
                          <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                            Vision & Critères de Recherche
                          </h3>
                          <div className="space-y-6">
                            <div className="bg-wedding-navy/5 p-8 rounded-[2rem] border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-4 italic">Le Profil Idéal</p>
                              <p className="text-lg font-serif italic text-wedding-navy font-medium leading-relaxed mb-6">"{selectedProfile.lookingFor}"</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-2">Milieu familial</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.searchFamily || 'Non spécifié'}</p>
                                  {selectedProfile.searchFamilyDetails && <p className="text-[11px] text-wedding-navy/60 italic mt-1">{selectedProfile.searchFamilyDetails}</p>}
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-2">Style vestimentaire</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.searchClothing || 'Non spécifié'}</p>
                                  {selectedProfile.searchClothingDetails && <p className="text-[11px] text-wedding-navy/60 italic mt-1">{selectedProfile.searchClothingDetails}</p>}
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-2">Type de téléphone</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.searchPhone || 'Non spécifié'}</p>
                                  {selectedProfile.searchPhoneDetails && <p className="text-[11px] text-wedding-navy/60 italic mt-1">{selectedProfile.searchPhoneDetails}</p>}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Traits de caractère recherchés</p>
                                <p className="text-sm font-bold text-wedding-navy mb-2">{selectedProfile.searchTraits || '-'}</p>
                                {selectedProfile.searchTraitsDetails && <p className="text-xs text-wedding-navy/60 italic">"{selectedProfile.searchTraitsDetails}"</p>}
                              </div>
                              <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Priorités dans la recherche</p>
                                <p className="text-sm font-bold text-wedding-navy mb-2">{selectedProfile.searchPriorities || '-'}</p>
                                {selectedProfile.searchPrioritiesDetails && <p className="text-xs text-wedding-navy/60 italic">"{selectedProfile.searchPrioritiesDetails}"</p>}
                              </div>
                            </div>

                            <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner">
                              <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-3 italic">Ambitions & Projets de Vie</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-1">Professionnel</p>
                                  <p className="text-sm font-medium text-wedding-navy/80">{selectedProfile.ambitionCareer || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-1">Lieu de vie</p>
                                  <p className="text-sm font-medium text-wedding-navy/80">{selectedProfile.ambitionLocation || '-'}</p>
                                </div>
                              </div>
                              {selectedProfile.ambitions && (
                                <div className="mt-4 pt-4 border-t border-wedding-navy/10">
                                  <p className="text-[10px] text-wedding-gold font-bold uppercase tracking-tight mb-1">Détails Ambitions</p>
                                  <p className="text-sm font-medium text-wedding-navy/80 leading-relaxed italic">"{selectedProfile.ambitions}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Famille & Références */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                            <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                              Environnement Familial
                            </h3>
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner space-y-6">
                              <div className="grid grid-cols-2 gap-6">
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
                              {selectedProfile.parentsOrigin && (
                                <div className="pt-4 border-t border-wedding-navy/5">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Origines</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.parentsOrigin}</p>
                                </div>
                              )}
                              {selectedProfile.familyDescription && (
                                <div className="pt-4 border-t border-wedding-navy/5">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Structure & Milieu</p>
                                  <p className="text-sm font-medium text-wedding-navy/80 leading-relaxed">{selectedProfile.familyDescription}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-[10px] font-bold text-wedding-navy/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-wedding-gold"></div>
                              Rapports & Références
                            </h3>
                            <div className="bg-white/40 p-6 rounded-3xl border border-wedding-navy/5 shadow-inner space-y-5">
                              <div>
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Rav de la Yéchiva / Séminaire</p>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-wedding-navy/5 shadow-sm">
                                  <User className="w-4 h-4 text-wedding-gold" />
                                  <p className="text-xs font-bold text-wedding-navy">{selectedProfile.ravYeshiva || '-'}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-2 italic">Rav de la Communauté</p>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-wedding-navy/5 shadow-sm">
                                  <Users className="w-4 h-4 text-wedding-gold" />
                                  <p className="text-xs font-bold text-wedding-navy">{selectedProfile.ravKehila || '-'}</p>
                                </div>
                              </div>
                              {selectedProfile.community && (
                                <div className="pt-2">
                                  <p className="text-[9px] font-bold text-wedding-navy/40 uppercase tracking-widest mb-1 italic">Voisinage / Kehila</p>
                                  <p className="text-sm font-bold text-wedding-navy">{selectedProfile.community}</p>
                                </div>
                              )}
                            </div>
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setModalAction('profile_note');
                                setModalTaskText(noteBuffer);
                                setShowAddTaskModal(true);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-wedding-gold/20 text-wedding-navy px-4 py-2 rounded-full hover:bg-wedding-gold/30 transition-all border border-wedding-gold/20"
                            >
                              <Plus className="w-3.5 h-3.5 text-wedding-navy" /> Ajouter / Modifier
                            </button>
                            {selectedProfile.privateNotes !== noteBuffer && (
                              <button
                                onClick={saveNotes}
                                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 bg-wedding-navy text-white px-5 py-2 rounded-full hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20"
                              >
                                <Save className="w-4 h-4 text-wedding-gold" /> Enregistrer
                              </button>
                            )}
                          </div>
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
                    </div>
                  ) : null}
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
                        {profiles.filter(p => p.gender === Gender.MALE && !matches.some(m => (m.boyId === p.id || m.girlId === p.id) && m.status !== MatchStatus.ARCHIVED && m.status !== MatchStatus.DROPPED)).map(p => (
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
                        {profiles.filter(p => p.gender === Gender.FEMALE && !matches.some(m => (m.boyId === p.id || m.girlId === p.id) && m.status !== MatchStatus.ARCHIVED && m.status !== MatchStatus.DROPPED)).map(p => (
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

          {/* Add Task/Note Modal */}
          {
            showAddTaskModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-wedding-navy/40 backdrop-blur-md">
                <div className="glass-card p-10 w-full max-w-md border-wedding-navy/5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CheckSquare className="w-32 h-32 text-wedding-gold" />
                  </div>

                  <div className="flex justify-between items-center mb-8 relative">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-wedding-navy tracking-tight">Nouvelle Note</h3>
                      <p className="text-[10px] text-wedding-navy/40 font-bold uppercase tracking-widest mt-1">Écrivez ce qui vous passe par la tête</p>
                    </div>
                    <button onClick={() => setShowAddTaskModal(false)} className="text-wedding-navy/20 hover:text-wedding-navy transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <textarea
                    autoFocus
                    value={modalTaskText}
                    onChange={(e) => setModalTaskText(e.target.value)}
                    placeholder="Tapez votre note ici..."
                    className="w-full bg-wedding-navy/5 border border-wedding-navy/5 rounded-3xl p-6 text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all min-h-[150px] shadow-inner font-medium leading-relaxed relative"
                  />

                  <div className="mt-8 flex gap-4 relative">
                    <button
                      onClick={() => setShowAddTaskModal(false)}
                      className="flex-1 px-4 py-4 bg-wedding-navy/5 text-wedding-navy rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-wedding-navy/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleModalSave}
                      disabled={!modalTaskText.trim()}
                      className="flex-1 px-4 py-4 bg-wedding-navy text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-wedding-navy/90 transition-all shadow-xl shadow-wedding-navy/20 border border-wedding-gold/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 text-wedding-gold" /> Enregistrer
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
                  <div className="p-6 border-b border-wedding-navy/5 bg-wedding-navy/5 space-y-4">
                    <h3 className="text-sm font-serif font-bold text-wedding-navy uppercase tracking-luxury">Messagerie</h3>

                    {/* Chat Search Bar */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-wedding-navy/30 group-focus-within:text-wedding-gold transition-colors" />
                      <input
                        type="text"
                        placeholder="RECHERCHER UN JEUNE..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full bg-white/50 border border-wedding-navy/10 rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-wedding-navy focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const filtered = profiles.filter(p => {
                        const name = (p.firstName + ' ' + p.lastName).toLowerCase();
                        const query = chatSearchQuery.toLowerCase();
                        const matchesSearch = name.includes(query);
                        const hasMessages = idsWithMessages.includes(p.id);

                        // Exclusivity filter
                        const isExclusivelyMatched = matches.some(m =>
                          (m.boyId === p.id || m.girlId === p.id) &&
                          m.status !== MatchStatus.ARCHIVED &&
                          m.status !== MatchStatus.DROPPED &&
                          m.createdById !== undefined &&
                          m.createdById !== shadchanProfile?.id
                        );

                        if (isExclusivelyMatched) return false;

                        if (chatSearchQuery) return matchesSearch;
                        return hasMessages;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-10 text-center space-y-3">
                            <p className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-widest">
                              {chatSearchQuery ? "AUCUN RÉSULTAT" : "AUCUNE DISCUSSION"}
                            </p>
                            <p className="text-[9px] text-wedding-navy/20 italic">
                              {chatSearchQuery ? "Essayez un autre nom" : "Utilisez la barre de recherche pour commencer à parler"}
                            </p>
                          </div>
                        );
                      }

                      return filtered.map(p => {
                        const assignedS = shadchans.find(s => s.id === p.assignedShadchanId);
                        const isSelected = chatProfile?.id === p.id;

                        return (
                          <div
                            key={p.id}
                            onClick={() => setChatProfile(p)}
                            className={`mx-3 my-1 p-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent group ${isSelected ? 'bg-white shadow-lg border-wedding-navy/5 scale-[1.02]' : 'hover:bg-white/40'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif font-bold shrink-0 shadow-sm transition-colors relative ${isSelected ? 'bg-wedding-navy text-wedding-gold' : 'bg-white text-wedding-navy border border-wedding-navy/5 group-hover:border-wedding-gold/30'}`}>
                                {p.imageUrl ?
                                  <img src={p.imageUrl} alt={p.firstName} className="w-full h-full rounded-full object-cover" />
                                  : p.firstName.charAt(0)
                                }
                                {getLastSeenText(p.lastActiveAt).active && (
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                  <h4 className={`font-bold text-xs truncate transition-colors ${isSelected ? 'text-wedding-navy' : 'text-wedding-navy/80 group-hover:text-wedding-navy'}`}>
                                    {p.firstName} {p.lastName}
                                  </h4>
                                  {assignedS && (
                                    <span className="text-[8px] opacity-40 uppercase tracking-tighter font-bold">
                                      {assignedS.name.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className={`text-[10px] truncate font-medium tracking-wide transition-colors ${isSelected ? 'text-wedding-gold/80' : 'text-wedding-navy/40 group-hover:text-wedding-navy/60'}`}>
                                    {idsWithMessages.includes(p.id) ? "Message en attente" : "Démarrer une discussion"}
                                  </p>
                                  {idsWithMessages.includes(p.id) && !isSelected && (unreadCountsByUser[p.id] || 0) > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-wedding-gold text-wedding-navy text-[10px] font-bold flex items-center justify-center shadow-md shadow-wedding-gold/20 animate-in zoom-in duration-300">
                                      {unreadCountsByUser[p.id]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 glass-card border-wedding-navy/5 overflow-hidden flex flex-col h-[700px] shadow-2xl shadow-wedding-navy/5">
                  {chatProfile ? (
                    <>
                      <div className="p-6 border-b border-wedding-navy/5 flex items-center justify-between bg-white/40 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-wedding-navy text-wedding-gold flex items-center justify-center text-lg font-serif font-bold shadow-lg border-2 border-white ring-1 ring-wedding-navy/5">
                            {chatProfile.ImageUrl ? <img src={chatProfile.ImageUrl} className="w-full h-full rounded-2xl object-cover" /> : chatProfile.firstName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-xl text-wedding-navy leading-tight">{chatProfile.firstName} {chatProfile.lastName}</h3>
                            {(() => {
                              const status = getLastSeenText(chatProfile.lastActiveAt);
                              return (
                                <p className={`text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-widest mt-1 ${status.color}`}>
                                  <span className={`w-2 h-2 rounded-full ${status.active ? 'bg-green-500 animate-pulse shadow-sm shadow-green-200' : 'bg-gray-300'}`}></span>
                                  {status.text}
                                </p>
                              );
                            })()}
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
                            <div key={msg.id} className={`flex items-end gap-3 mb-6 ${msg.direction === 'FROM_SHADCHAN' ? 'justify-end' : 'justify-start'}`}>
                              {/* Avatar for Candidate */}
                              {msg.direction !== 'FROM_SHADCHAN' && (
                                <div className="w-8 h-8 rounded-full bg-white border border-wedding-navy/5 flex items-center justify-center text-xs font-serif font-bold text-wedding-navy shadow-sm shrink-0 mb-1 ring-2 ring-white">
                                  {chatProfile?.imageUrl ? (
                                    <img src={chatProfile.imageUrl} alt={chatProfile.firstName} className="w-full h-full rounded-full object-cover" />
                                  ) : chatProfile?.firstName.charAt(0)}
                                </div>
                              )}

                              <div className={`max-w-[70%] lg:max-w-[60%] group relative`}>
                                <div className={`px-5 py-3.5 text-sm shadow-sm transition-all ${msg.direction === 'FROM_SHADCHAN'
                                  ? 'bg-wedding-navy text-white rounded-2xl rounded-tr-sm shadow-wedding-navy/10'
                                  : 'bg-white text-wedding-navy border border-wedding-navy/5 rounded-2xl rounded-tl-sm shadow-wedding-navy/5'
                                  }`}>
                                  <div className="leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
                                </div>
                                <div className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-40 px-1 ${msg.direction === 'FROM_SHADCHAN' ? 'text-right' : 'text-left'}`}>
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
                            placeholder="Écrivez votre message..."
                            className="flex-1 px-6 py-4 bg-wedding-navy/5 border border-wedding-navy/5 rounded-2xl focus:outline-none focus:bg-white focus:border-wedding-gold/30 transition-all font-medium text-sm text-wedding-navy placeholder:text-wedding-navy/40 shadow-inner"
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