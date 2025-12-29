
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
});

const mapProfileToDB = (p: Partial<Profile>) => {
    const dbProfile: any = { ...p };
    if (p.firstName) dbProfile.first_name = p.firstName;
    if (p.lastName) dbProfile.last_name = p.lastName;
    if (p.aboutMe) dbProfile.about_me = p.aboutMe;
    if (p.lookingFor) dbProfile.looking_for = p.lookingFor;
    if (p.contactPhone) dbProfile.contact_phone = p.contactPhone;
    if (p.imageUrl) dbProfile.image_url = p.imageUrl;
    if (p.createdAt) dbProfile.created_at = p.createdAt;
    if (p.isFavorite !== undefined) dbProfile.is_favorite = p.isFavorite;
    if (p.privateNotes) dbProfile.private_notes = p.privateNotes;
    if (p.interactionHistory) dbProfile.interaction_history = p.interactionHistory;
    if (p.references) dbProfile.references = p.references;
    if (p.documents) dbProfile.documents = p.documents;
    if (p.aliyahStatus) dbProfile.aliyah_status = p.aliyahStatus;
    if (p.familyBackground) dbProfile.family_background = p.familyBackground;
    if (p.locationRadius) dbProfile.location_radius = p.locationRadius;
    if (p.religiousLevel) dbProfile.religious_level = p.religiousLevel;
    if (p.email) dbProfile.email = p.email;
    if (p.accessCode) dbProfile.access_code = p.accessCode;
    if (p.tags) dbProfile.tags = p.tags;
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
    
    // Remove camelCase keys to be clean (optional but good)
    delete dbProfile.firstName;
    delete dbProfile.lastName;
    delete dbProfile.aboutMe;
    delete dbProfile.lookingFor;
    delete dbProfile.contactPhone;
    delete dbProfile.imageUrl;
    delete dbProfile.createdAt;
    delete dbProfile.isFavorite;
    delete dbProfile.privateNotes;
    delete dbProfile.interactionHistory;
    delete dbProfile.aliyahStatus;
    delete dbProfile.familyBackground;
    delete dbProfile.locationRadius;
    delete dbProfile.locationRadius;
    delete dbProfile.religiousLevel;
    // delete dbProfile.email; // KEEP THIS! It matches the DB column.
    delete dbProfile.accessCode;
    delete dbProfile.tags;
    delete dbProfile.assignedShadchanId;
    delete dbProfile.birthDate;
    delete dbProfile.fatherName;
    delete dbProfile.motherName;
    delete dbProfile.fatherPhone;
    delete dbProfile.motherPhone;
    delete dbProfile.educationalPath;
    delete dbProfile.familyDescription;
    delete dbProfile.ambitions;
    delete dbProfile.community;
    delete dbProfile.selfDescription;
    delete dbProfile.rabbanimContacts;
    
    return dbProfile;
};

export const api = {
    // Profiles
    getProfiles: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map(mapProfileFromDB);
    },
    createProfile: async (profile: Profile) => {
        const dbProfile = mapProfileToDB(profile);
        const { data, error } = await supabase.from('profiles').insert(dbProfile).select().single();
        if (error) throw error;
        return mapProfileFromDB(data);
    },
    updateProfile: async (profile: Profile) => {
        const dbProfile = mapProfileToDB(profile);
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
    candidateLogin: async (email: string, code: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .eq('access_code', code)
            .maybeSingle(); // Use maybeSingle to return null instead of throwing error if not found
            
        if (error) throw error;
        if (!data) return null; // Gracefully return null if no user found
        return mapProfileFromDB(data);
    },

    // Matches
    getMatches: async () => {
         const { data, error } = await supabase.from('matches').select('*');
         if (error) throw error;
         return data.map((m: any) => ({
             ...m,
             boyId: m.boy_id,
             girlId: m.girl_id,
             lastUpdated: m.last_updated
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
            last_updated: match.lastUpdated
        };
        const { error } = await supabase.from('matches').upsert(dbMatch);
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
        if (error) throw error;
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
    getShadchanProfile: async (id: number = 1) => {
        const { data, error } = await supabase.from('shadchan_profile').select('*').eq('id', id).single();
        if (error) {
             console.warn(`Error fetching shadchan profile ${id}:`, error);
             return null;
        }
        return data;
    },
    updateShadchanProfile: async (profile: any) => {
        // If id is provided use it, otherwise default to 1 for backward compat
        const { error } = await supabase.from('shadchan_profile').upsert({ ...profile, id: profile.id || 1 });
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

    // Activities
    logActivity: async (log: any) => {
        const dbLog = {
            id: log.id,
            type: log.type,
            description: log.description,
            timestamp: log.timestamp
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
            .eq('direction', 'FROM_CANDIDATE');
        if (error) throw error;
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
    }
};
