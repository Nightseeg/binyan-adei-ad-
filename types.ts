export enum Gender {
  MALE = "Homme",
  FEMALE = "Femme",
}

export enum ReligiousLevel {
  MODERN_ORTHODOX = "Moderne Orthodoxe",
  YESHIVISH = "Yeshivish",
  CHASSIDISH = "Hassidique",
  TRADITIONAL = "Traditionaliste",
  DATI_LEUMI = "Dati Leumi",
  BAAL_TESHUVA = "Baal Teshuva",
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  city: string;
  occupation: string;
  height: string;
  religiousLevel: ReligiousLevel;
  aboutMe: string;
  lookingFor: string;
  contactPhone: string;
  email?: string; // For login/notifications
  accessCode?: string; // Simple password for editing
  imageUrl?: string; // Optional placeholder
  photos?: string[]; // Gallery of photos
  createdAt?: number; // Timestamp for sorting
  isFavorite?: boolean;
  privateNotes?: string;
  tags?: string[];
  interactionHistory?: {
    id: string;
    date: number;
    type: 'CALL' | 'MEETING' | 'EMAIL' | 'OTHER';
    notes: string;
  }[];
  references?: Reference[];
  documents?: Document[];
  languages?: string[];
  aliyahStatus?: string;
  familyBackground?: string;
  locationRadius?: number; // km preference
  assignedShadchanId?: number;
  birthDate?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  educationalPath?: string;
  familyDescription?: string;
  ambitions?: string;
  community?: string;
  selfDescription?: string;
  rabbanimContacts?: string;
}

export interface Reference {
  name: string;
  relation: string;
  contact: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string; // 'pdf', 'image', 'other'
  uploadedAt: number;
}

export interface MatchSuggestion {
  candidateId: string;
  matchPercentage: number;
  reasoning: string;
}

export interface AIResponse {
  suggestions: MatchSuggestion[];
}

export interface MatchingCriteria {
  minAge?: number;
  maxAge?: number;
  minHeight?: number; // cm
  maxHeight?: number; // cm
  preferredHashkafa?: ReligiousLevel[];
  occupation?: string;
  minScore?: number;
  languages?: string[];
  aliyahStatus?: string;
}

export enum MatchStatus {
  NEW = "Nouveau",
  RESEARCHING = "En Recherche",
  SUGGESTED = "Suggéré",
  DATING = "En Rencontre",
  ENGAGED = "Fiancés",
  ARCHIVED = "Archivé",
  DROPPED = "Annulé",
}

export interface Match {
  id: string;
  boyId: string;
  girlId: string;
  status: MatchStatus;
  notes: string;
  lastUpdated: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
