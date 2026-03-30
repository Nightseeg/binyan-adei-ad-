
import { supabase } from './supabaseClient';
import { Profile, Match, Task, MatchStatus } from '../types';

// Helpers to map DB <-> App

// Profile Mapping
const mapProfileFromDB = (p: any): Profile => ({
    ...p,
    firstName: p.first_name,
    lastName: p.last_name,
    aboutMe: p.about_me,
    lookingFor: p.looking_for,
    contactPhone: p.contact_phone,
    imageUrl: p.image_url,
    createdAt: p.created_at,
    isFavorite: p.is_favorite,
    privateNotes: p.private_notes,
    interactionHistory: p.interaction_history || [],
    references: p.references || [],
    documents: p.documents || [],
    aliyahStatus: p.aliyah_status,
    familyBackground: p.family_background,
    locationRadius: p.location_radius,
    religiousLevel: p.religious_level,
    email: p.email,
    accessCode: p.access_code,
    tags: p.tags || [],
    assignedShadchanId: p.assigned_shadchan_id,
    birthDate: p.birth_date,
    fatherName: p.father_name,
    motherName: p.mother_name,
    fatherPhone: p.father_phone,
    motherPhone: p.mother_phone,
    educationalPath: p.educational_path,
    familyDescription: p.family_description,
    ambitions: p.ambitions,
    community: p.community,
    selfDescription: p.self_description,
    rabbanimContacts: p.rabbanim_contacts,
    primarySchool: p.primary_school,
    middleSchool: p.middle_school,
    highSchool: p.high_school,
    ravYeshiva: p.rav_yeshiva,
    ravKehila: p.rav_kehila,
    yeshivaKtana: p.yeshiva_ktana,
    yeshivaGdola: p.yeshiva_gdola,
    currentOccupation: p.current_occupation,
    qualifications: p.qualifications,
    isSmoking: p.is_smoking,
    smokingDetails: p.smoking_details,
    skinColor: p.skin_color,
    eyeColor: p.eye_color,
    hairColor: p.hair_color,
    ambitionCareer: p.ambition_career,
    ambitionLocation: p.ambition_location,
    personalTraits: p.personal_traits,
    personalClothing: p.personal_clothing,
    personalPhone: p.personal_phone,
    searchFamily: p.search_family,
    searchClothing: p.search_clothing,
    searchPhone: p.search_phone,
    searchTraits: p.search_traits,
    searchPriorities: p.search_priorities,
    personalTraitsDetails: p.personal_traits_details,
    personalClothingDetails: p.personal_clothing_details,
    personalPhoneDetails: p.personal_phone_details,
    searchFamilyDetails: p.search_family_details,
    searchClothingDetails: p.search_clothing_details,
    searchPhoneDetails: p.search_phone_details,
    searchTraitsDetails: p.search_traits_details,
    searchPrioritiesDetails: p.search_priorities_details,
    parentsOrigin: p.parents_origin,
    bodyType: p.body_type,
    headCoveringPreference: p.head_covering_preference,
    lastActiveAt: p.last_active_at,

    nusach: p.nusach,
    searchNusach: p.search_nusach,
    searchSocial: p.search_social,
    lookingForJob: p.looking_for_job,
    lookingForHashkafa: p.looking_for_hashkafa,
    lookingForYiratShamayim: p.looking_for_yirat_shamayim,
    agreedToTerms: p.agreed_to_terms,
});

const mapProfileToDB = (p: Partial<Profile>) => {
    // Explicitly map only the columns that exist in the database
    const dbProfile: any = {};
    
    if (p.id) dbProfile.id = p.id;
    if (p.firstName) dbProfile.first_name = p.firstName;
    if (p.lastName) dbProfile.last_name = p.lastName;
    if (p.age) dbProfile.age = p.age;
    if (p.gender) dbProfile.gender = p.gender;
    if (p.city) dbProfile.city = p.city;
    if (p.occupation) dbProfile.occupation = p.occupation;
    if (p.height) dbProfile.height = p.height;
    if (p.religiousLevel) dbProfile.religious_level = p.religiousLevel;
    if (p.aboutMe) dbProfile.about_me = p.aboutMe;
    if (p.lookingFor) dbProfile.looking_for = p.lookingFor;
    if (p.contactPhone) dbProfile.contact_phone = p.contactPhone;
    if (p.email) dbProfile.email = p.email;
    if (p.accessCode) dbProfile.access_code = p.accessCode;
    if (p.imageUrl) dbProfile.image_url = p.imageUrl;
    if (p.photos) dbProfile.photos = p.photos;
    if (p.createdAt) dbProfile.created_at = p.createdAt;
    if (p.isFavorite !== undefined) dbProfile.is_favorite = p.isFavorite;
    if (p.privateNotes) dbProfile.private_notes = p.privateNotes;
    if (p.tags) dbProfile.tags = p.tags;
    if (p.interactionHistory) dbProfile.interaction_history = p.interactionHistory;
    if (p.references) dbProfile.references = p.references;
    if (p.documents) dbProfile.documents = p.documents;
    if (p.languages) dbProfile.languages = p.languages;
    if (p.aliyahStatus) dbProfile.aliyah_status = p.aliyahStatus;
    if (p.familyBackground) dbProfile.family_background = p.familyBackground;
    if (p.locationRadius) dbProfile.location_radius = p.locationRadius;
    if (p.assignedShadchanId) dbProfile.assigned_shadchan_id = p.assignedShadchanId;
    if (p.birthDate) dbProfile.birth_date = p.birthDate;
    if (p.fatherName) dbProfile.father_name = p.fatherName;
    if (p.motherName) dbProfile.mother_name = p.motherName;
    if (p.fatherPhone) dbProfile.father_phone = p.fatherPhone;
    if (p.motherPhone) dbProfile.mother_phone = p.motherPhone;
    if (p.educationalPath) dbProfile.educational_path = p.educationalPath;
    if (p.familyDescription) dbProfile.family_description = p.familyDescription;
    if (p.ambitions) dbProfile.ambitions = p.ambitions;
    if (p.community) dbProfile.community = p.community;
    if (p.selfDescription) dbProfile.self_description = p.selfDescription;
    if (p.rabbanimContacts) dbProfile.rabbanim_contacts = p.rabbanimContacts;
    if (p.primarySchool) dbProfile.primary_school = p.primarySchool;
    if (p.middleSchool) dbProfile.middle_school = p.middleSchool;
    if (p.highSchool) dbProfile.high_school = p.highSchool;
    if (p.ravYeshiva) dbProfile.rav_yeshiva = p.ravYeshiva;
    if (p.ravKehila) dbProfile.rav_kehila = p.ravKehila;
    if (p.yeshivaKtana) dbProfile.yeshiva_ktana = p.yeshivaKtana;
    if (p.yeshivaGdola) dbProfile.yeshiva_gdola = p.yeshivaGdola;
    if (p.currentOccupation) dbProfile.current_occupation = p.currentOccupation;
    if (p.qualifications) dbProfile.qualifications = p.qualifications;
    if (p.isSmoking) dbProfile.is_smoking = p.isSmoking;
    if (p.smokingDetails) dbProfile.smoking_details = p.smokingDetails;
    if (p.skinColor) dbProfile.skin_color = p.skinColor;
    if (p.eyeColor) dbProfile.eye_color = p.eyeColor;
    if (p.hairColor) dbProfile.hair_color = p.hairColor;
    if (p.ambitionCareer) dbProfile.ambition_career = p.ambitionCareer;
    if (p.ambitionLocation) dbProfile.ambition_location = p.ambitionLocation;
    if (p.personalTraits) dbProfile.personal_traits = p.personalTraits;
    if (p.personalClothing) dbProfile.personal_clothing = p.personalClothing;
    if (p.personalPhone) dbProfile.personal_phone = p.personalPhone;
    if (p.searchFamily) dbProfile.search_family = p.searchFamily;
    if (p.searchClothing) dbProfile.search_clothing = p.searchClothing;
    if (p.searchPhone) dbProfile.search_phone = p.searchPhone;
    if (p.searchTraits) dbProfile.search_traits = p.searchTraits;
    if (p.searchPriorities) dbProfile.search_priorities = p.searchPriorities;
    if (p.personalTraitsDetails) dbProfile.personal_traits_details = p.personalTraitsDetails;
    if (p.personalClothingDetails) dbProfile.personal_clothing_details = p.personalClothingDetails;
    if (p.personalPhoneDetails) dbProfile.personal_phone_details = p.personalPhoneDetails;
    if (p.searchFamilyDetails) dbProfile.search_family_details = p.searchFamilyDetails;
    if (p.searchClothingDetails) dbProfile.search_clothing_details = p.searchClothingDetails;
    if (p.searchPhoneDetails) dbProfile.search_phone_details = p.searchPhoneDetails;
    if (p.searchTraitsDetails) dbProfile.search_traits_details = p.searchTraitsDetails;
    if (p.searchPrioritiesDetails) dbProfile.search_priorities_details = p.searchPrioritiesDetails;
    if (p.parentsOrigin) dbProfile.parents_origin = p.parentsOrigin;
    if (p.bodyType) dbProfile.body_type = p.bodyType;
    if (p.headCoveringPreference) dbProfile.head_covering_preference = p.headCoveringPreference;
    if (p.lastActiveAt) dbProfile.last_active_at = p.lastActiveAt;
    if (p.nusach) dbProfile.nusach = p.nusach;
    if (p.searchNusach) dbProfile.search_nusach = p.searchNusach;
    if (p.searchSocial) dbProfile.search_social = p.searchSocial;
    if (p.lookingForJob) dbProfile.looking_for_job = p.lookingForJob;
    if (p.lookingForHashkafa) dbProfile.looking_for_hashkafa = p.lookingForHashkafa;
    if (p.lookingForYiratShamayim) dbProfile.looking_for_yirat_shamayim = p.lookingForYiratShamayim;
    if (p.agreedToTerms !== undefined) dbProfile.agreed_to_terms = p.agreedToTerms;

    return dbProfile;
};

const sanitizeText = (text: string) => {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/gim, "")
        .replace(/javascript:[^"]*/gim, "");
};

const sanitizeProfile = (profile: Profile): Profile => {
    const p = { ...profile };
    const textFields: (keyof Profile)[] = [
        'firstName', 'lastName', 'aboutMe', 'lookingFor', 'privateNotes',
        'educationalPath', 'familyDescription', 'ambitions', 'community',
        'selfDescription', 'rabbanimContacts', 'schoolCareer', 'qualifications'
    ];
    
    textFields.forEach(field => {
        if (p[field] && typeof p[field] === 'string') {
            (p as any)[field] = sanitizeText(p[field] as string);
        }
    });

    return p;
};

export const api = {
    // Profiles
    getProfiles: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map(mapProfileFromDB);
    },
    createProfile: async (profile: Profile) => {
        const sanitized = sanitizeProfile(profile);
        const dbProfile = mapProfileToDB(sanitized);
        const { data, error } = await supabase.from('profiles').insert(dbProfile).select().single();
        if (error) throw error;

        // Send email notification to admin (fire and forget)
        console.log("Triggering notification for:", profile.email);
        supabase.functions.invoke('notify-registration', {
            body: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                gender: profile.gender,
                city: profile.city,
                email: profile.email,
                phone: profile.contactPhone
            }
        }).then(({ data, error }) => {
            if (error) console.error('Notification function error response:', error);
            else console.log('Notification function success:', data);
        }).catch(err => console.error('Notification invoke catch error:', err));

        return mapProfileFromDB(data);
    },
    updateProfile: async (profile: Profile) => {
        const sanitized = sanitizeProfile(profile);
        const dbProfile = mapProfileToDB(sanitized);
        const { data, error } = await supabase.from('profiles').update(dbProfile).eq('id', profile.id).select().single();
        if (error) throw error;
        return mapProfileFromDB(data);
    },
    importProfiles: async (profiles: Profile[]) => {
        const dbProfiles = profiles.map(mapProfileToDB);
        const { error } = await supabase.from('profiles').upsert(dbProfiles);
        if (error) throw error;
    },
    deleteProfile: async (id: string) => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },
    updateLastActive: async (profileId: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ last_active_at: Date.now() })
            .eq('id', profileId);
        if (error) console.error("Error updating presence:", error);
    },
    candidateLogin: async (email: string, code: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .eq('access_code', code.trim())
            .single();

        if (error || !data) return null;
        return mapProfileFromDB(data);
    },

    resetCandidatePassword: async (email: string) => {
        try {
            const { data, error } = await supabase.functions.invoke('candidate-recovery', {
                body: { email: email.trim().toLowerCase() }
            });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Erreur réinitialisation candidat:", err);
            throw err;
        }
    },

    resetShadchanPassword: async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        return data;
    },

    checkEmailExists: async (email: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();
        if (error) return false;
        return !!data;
    },

    checkShadchanEmailExists: async (email: string) => {
        const { data, error } = await supabase
            .from('shadchan_profile')
            .select('email')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();
        if (error) return false;
        return !!data;
    },


    // Matches
    getMatches: async () => {
         const { data, error } = await supabase.from('matches').select('*');
         if (error) throw error;
         return data.map((m: any) => ({
             ...m,
             boyId: m.boy_id,
             girlId: m.girl_id,
             lastUpdated: m.last_updated,
             createdById: m.created_by_id
         }));
    },
    saveMatch: async (match: Match) => {
        // Upsert
        const dbMatch = {
            id: match.id,
            boy_id: match.boyId,
            girl_id: match.girlId,
            status: match.status,
            notes: match.notes,
            last_updated: match.lastUpdated,
            created_by_id: match.createdById
        };
        const { error } = await supabase.from('matches').upsert(dbMatch);
        if (error) throw error;
    },
    deleteMatch: async (id: string) => {
        const { error } = await supabase.from('matches').delete().eq('id', id);
        if (error) throw error;
    },
    
    // Tasks
    getTasks: async () => {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        return data.map((t: any) => ({ ...t, createdAt: t.created_at }));
    },
    createTask: async (task: Task) => {

        const dbTask = {
            id: task.id,
            text: task.text,
            completed: task.completed,
            created_at: task.createdAt
        };
        const { error } = await supabase.from('tasks').insert(dbTask);
        if (error) {
            console.error("api.createTask: Supabase error", error);
            throw error;
        }

    },
    updateTask: async (task: Task) => {
        const dbTask = {
            id: task.id,
            text: task.text,
            completed: task.completed,
            created_at: task.createdAt
        };
        const { error } = await supabase.from('tasks').update(dbTask).eq('id', task.id);
        if (error) throw error;
    },
    deleteTask: async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    },

    // Shadchan Profile
    getShadchanProfile: async (id: number) => {
        const { data, error } = await supabase.from('shadchan_profile').select('*').eq('id', id).single();
        if (error) {
             console.warn(`Error fetching shadchan profile ${id}:`, error);
             return null;
        }
        return data;
    },
    updateShadchanProfile: async (profile: any) => {
        if (!profile.id) throw new Error("Profile ID is required for update");
        const { error } = await supabase.from('shadchan_profile').upsert(profile);
        if (error) throw error;
    },
    getShadchans: async () => {
        const { data, error } = await supabase.from('shadchan_profile').select('*');
        if (error) {
             console.warn("Error fetching shadchans:", error);
             return [];
        }
        return data;
    },
    getShadchanByEmail: async (email: string) => {
        const { data, error } = await supabase.from('shadchan_profile').select('*').eq('email', email).single();
        if (error) return null;
        return data;
    },

    // Activities
    logActivity: async (log: any) => {
        const dbLog = {
            id: log.id,
            type: log.type,
            description: log.description,
            timestamp: log.timestamp,
            created_by: log.shadchanId,
            metadata: log.metadata
        };
        await supabase.from('activity_logs').insert(dbLog);
    },
    getActivities: async () => {
        const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(50);
        if (error) throw error;
        return data;
    },

    // Storage
    uploadFile: async (bucket: 'profiles' | 'documents', file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        if (bucket === 'documents') {
            // For private bucket, return the path, NOT the public URL.
            // The application must specifically know to treat this string as a path.
            // A convention could be "private:filePath" or just "filePath" but existing logic expects a URL?
            // Existing logic in ShadchanDashboard expects a URL string.
            // If I return the path, the dashboard will try to render it as a link.
            // I'll return a special identifier.
            return `private://${bucket}/${filePath}`;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    },
    
    // Secure Download for Private Files
    getDownloadUrl: async (path: string) => {
        if (!path.startsWith('private://')) return path; // Return as is if public
        
        const parts = path.replace('private://', '').split('/');
        const bucket = parts[0];
        const filePath = parts.slice(1).join('/');
        
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600); // 1 hour link
        if (error) throw error;
        return data.signedUrl;
    },



    // Messages
    getMessages: async (profileId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data.map((m: any) => ({
            id: m.id,
            profileId: m.profile_id,
            direction: m.direction,
            content: m.content,
            createdAt: m.created_at,
            isRead: m.is_read
        }));
    },
    sendMessage: async (msg: { profileId: string, direction: 'FROM_SHADCHAN' | 'FROM_CANDIDATE', content: string }) => {
        const dbMsg = {
           profile_id: msg.profileId,
           direction: msg.direction,
           content: msg.content,
           created_at: Date.now(),
           is_read: false
        };
        const { error } = await supabase.from('messages').insert(dbMsg);
        if (error) throw error;
    },
    getUnreadMessagesCount: async () => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('direction', 'FROM_CANDIDATE')
            .eq('is_read', false);
        if (error) throw error;
        return count || 0;
    },
    markMessagesAsRead: async (profileId: string) => {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('profile_id', profileId)
            .eq('direction', 'FROM_CANDIDATE')
            .eq('is_read', false);
        if (error) throw error;
    },

  getProfileIdsWithMessages: async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('profile_id');
    if (error) throw error;
    return Array.from(new Set(data.map((m: any) => m.profile_id)));
  },

  // Events & Blog (Community Pages)
    getEvents: async () => {
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (error) {
            console.warn("Error fetching events:", error);
            return []; // Return empty array on error (e.g. table missing) to prevent crash
        }
        return data;
    },

    getPosts: async () => {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) {
            console.warn("Error fetching posts:", error);
            return []; // Return empty array on error (e.g. table missing) to prevent crash
        }
        return data;
    },


};
