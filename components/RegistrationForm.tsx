import React, { useState } from 'react';
import { Gender, ReligiousLevel, Profile } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Save, ChevronRight, ChevronLeft, Check, User, Key, Mail, Phone, Calendar, MapPin, Users, Heart, GraduationCap, ClipboardList, Info, Star, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegistrationFormProps {
  onSave: (profile: Profile) => void;
  onCancel: () => void;
  initialData?: Profile;
  onLoginClick?: () => void;
}

const STEPS = [
  { id: 1, title: 'Identité', description: 'Informations de base' },
  { id: 2, title: 'Parents', description: 'Coordonnées & Famille' },
  { id: 3, title: 'Parcours', description: 'Études & Famille' },
  { id: 4, title: 'Vision', description: 'Ambitions & Kehila' },
  { id: 5, title: 'Moi', description: 'Description personnelle' },
  { id: 6, title: 'Recherche', description: 'Profil recherché' },
  { id: 7, title: 'Finalisation', description: 'Accès & Rabbanim' }
];

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSave, onCancel, initialData, onLoginClick }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Profile>>(initialData || {
    gender: Gender.MALE,
    religiousLevel: ReligiousLevel.YESHIVISH,
    photos: [],
    references: []
  });

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^[\d\s.+()-]{8,20}$/.test(phone);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Restrictions on input
    if (['lastName', 'firstName', 'fatherName', 'motherName'].includes(name)) {
      if (/[0-9]/.test(value)) return; // No numbers in names
    }

    if (['contactPhone', 'fatherPhone', 'motherPhone'].includes(name)) {
      if (value !== '' && !/^[\d\s.+()-]+$/.test(value)) return; // Only phone characters
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.lastName && formData.firstName && formData.birthDate && formData.contactPhone && isValidPhone(formData.contactPhone) && formData.height && formData.skinColor && formData.eyeColor && formData.hairColor);
      case 2:
        return !!(formData.fatherName && formData.motherName && formData.fatherPhone && formData.motherPhone && isValidPhone(formData.fatherPhone!) && isValidPhone(formData.motherPhone!));
      case 3:
        return !!(formData.schoolCareer && formData.yeshivaKtana && formData.yeshivaGdola && formData.currentOccupation);
      case 4:
        return !!(formData.ambitionCareer && formData.ambitionLocation && formData.ambitions && formData.community);
      case 5:
        return !!(formData.selfDescription && formData.isSmoking && formData.personalTraits && formData.personalClothing && formData.personalPhone);
      case 6:
        return !!(formData.searchFamily && formData.searchClothing && formData.searchPhone && formData.searchTraits && formData.searchPriorities && formData.lookingFor);
      case 7:
        return !!(formData.email && formData.accessCode && isValidEmail(formData.email));
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      let msg = "Veuillez remplir les champs obligatoires (*) avec des informations valides.";
      if (currentStep === 7 && formData.email && !isValidEmail(formData.email)) msg = "L'adresse email n'est pas valide.";
      alert(msg);
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(STEPS.length)) {
      alert("Veuillez vérifier vos accès (Email et Code).");
      return;
    }

    const newProfile: Profile = {
      ...formData,
      id: initialData?.id || uuidv4(),
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      age: calculateAge(formData.birthDate || ''),
      gender: formData.gender as Gender,
      city: formData.city || '',
      religiousLevel: formData.religiousLevel || ReligiousLevel.YESHIVISH,
      aboutMe: formData.selfDescription || '',
      lookingFor: formData.lookingFor || '',
      contactPhone: formData.contactPhone || '',
      email: formData.email?.toLowerCase().trim(),
      accessCode: formData.accessCode,
      imageUrl: formData.imageUrl || `https://picsum.photos/seed/${Math.random()}/200/200`,
      createdAt: initialData?.createdAt || Date.now()
    } as Profile;

    onSave(newProfile);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const inputClass = "mt-1 block w-full rounded-2xl border-2 border-wedding-navy/10 bg-white px-6 py-4 text-wedding-navy placeholder:text-wedding-navy/40 focus:border-wedding-gold/50 focus:ring-4 focus:ring-wedding-gold/5 transition-all duration-300 font-medium text-base shadow-sm";
  const areaClass = "mt-1 block w-full rounded-2xl border-2 border-wedding-navy/10 bg-white px-6 py-5 text-wedding-navy placeholder:text-wedding-navy/40 focus:border-wedding-gold/50 focus:ring-4 focus:ring-wedding-gold/5 transition-all duration-300 font-medium text-base shadow-sm resize-none";
  const labelClass = "block text-[13px] font-bold text-wedding-navy/80 uppercase tracking-[0.15em] mb-2.5 ml-1";

  const QCMGroup = ({ label, name, options, multi = true }: { label: string, name: string, options: string[], multi?: boolean }) => {
    const currentValues = (formData[name as keyof Profile] as string || '').split(',').filter(v => v);

    const toggle = (opt: string) => {
      let newValues: string[];
      if (!multi) {
        newValues = [opt];
      } else {
        if (currentValues.includes(opt)) {
          newValues = currentValues.filter(v => v !== opt);
        } else {
          newValues = [...currentValues, opt];
        }
      }
      setFormData(prev => ({ ...prev, [name]: newValues.join(',') }));
    };

    return (
      <div className="space-y-4">
        <label className={labelClass}>{label}</label>
        <div className="flex flex-wrap gap-3">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-6 py-3 rounded-xl border-2 transition-all duration-300 font-bold text-sm shadow-sm
                ${currentValues.includes(opt)
                  ? 'bg-wedding-navy border-wedding-navy text-white shadow-xl shadow-wedding-navy/20 scale-105'
                  : 'bg-white border-wedding-navy/5 text-wedding-navy hover:border-wedding-gold/30 hover:bg-wedding-navy/[0.02]'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 20 : -20, opacity: 0 })
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-wedding-navy/5 overflow-hidden max-w-[1400px] w-full mx-auto flex flex-col md:flex-row min-h-[850px] transition-all">

      {/* Sidebar Navigation */}
      <div className="bg-wedding-navy text-white p-12 md:w-96 flex flex-col pt-20 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          <button onClick={onCancel} className="mb-10 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 text-wedding-gold" /> Accueil
          </button>

          <h2 className="text-4xl font-serif font-bold mb-3 leading-tight">Lev Echad</h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em] mb-16 italic">Votre futur commence ici</p>

          <div className="space-y-4 flex-1">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-start gap-5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-500
                            ${isActive ? 'bg-wedding-gold text-wedding-navy shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-110' :
                      isCompleted ? 'bg-white/10 text-wedding-gold' : 'text-white/20'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="pt-0.5">
                    <h3 className={`font-bold text-[11px] uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-white/20'}`}>{step.title}</h3>
                    {isActive && <p className="text-[10px] text-wedding-gold italic mt-1 animate-pulse">{step.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {!initialData && (
            <div className="mt-12 bg-white/5 rounded-2xl p-5 border border-white/5">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-3">Déjà inscrit ?</p>
              <button onClick={onLoginClick} className="text-xs text-wedding-gold font-bold hover:text-white transition-colors flex items-center gap-2 group">
                Se connecter <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        <div className="flex-1 relative p-10 md:p-16 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode='wait' custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "circOut" }}
              className="w-full max-w-3xl mx-auto"
            >
              {currentStep === 1 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <User className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Identité</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Commençons par les bases.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className={labelClass}>Nom *</label>
                      <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} className={inputClass} placeholder="Votre nom de famille" />
                    </div>
                    <div>
                      <label className={labelClass}>Prénom *</label>
                      <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className={inputClass} placeholder="Votre prénom" />
                    </div>
                    <div>
                      <label className={labelClass}>Date de naissance *</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={`${inputClass} pl-12`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Genre *</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                        <option value={Gender.MALE}>Homme</option>
                        <option value={Gender.FEMALE}>Femme</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tél Personnel *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                        <input type="text" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className={`${inputClass} pl-12`} placeholder="06 XX XX XX XX" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Ville de résidence *</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                        <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className={`${inputClass} pl-12`} placeholder="Ville actuelle" />
                      </div>
                    </div>

                    <div className="md:col-span-2 border-t border-wedding-navy/5 pt-8 mt-4">
                      <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] mb-6">Description Physique</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className={labelClass}>Taille (cm) *</label>
                          <input type="text" name="height" value={formData.height || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 175" />
                        </div>
                        <div>
                          <label className={labelClass}>Couleur de peau *</label>
                          <input type="text" name="skinColor" value={formData.skinColor || ''} onChange={handleChange} className={inputClass} placeholder="Clair, mat, etc." />
                        </div>
                        <div>
                          <label className={labelClass}>Couleur des yeux *</label>
                          <input type="text" name="eyeColor" value={formData.eyeColor || ''} onChange={handleChange} className={inputClass} placeholder="Bleus, marrons, etc." />
                        </div>
                        <div>
                          <label className={labelClass}>Couleur des cheveux *</label>
                          <input type="text" name="hairColor" value={formData.hairColor || ''} onChange={handleChange} className={inputClass} placeholder="Blonds, bruns, etc." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <Users className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Parents & Coordonnées</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Pour faciliter les contacts familiaux.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] border-b border-wedding-navy/5 pb-2">Le Père</h4>
                      <div>
                        <label className={labelClass}>Prénom Père *</label>
                        <input type="text" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Tél Père *</label>
                        <input type="text" name="fatherPhone" value={formData.fatherPhone || ''} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] border-b border-wedding-navy/5 pb-2">La Mère</h4>
                      <div>
                        <label className={labelClass}>Prénom & Nom fille Mère *</label>
                        <input type="text" name="motherName" value={formData.motherName || ''} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Tél Mère *</label>
                        <input type="text" name="motherPhone" value={formData.motherPhone || ''} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <GraduationCap className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Parcours & Famille</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Racontez-nous votre histoire.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>École Primaire / Collège / Lycée *</label>
                        <input type="text" name="schoolCareer" value={formData.schoolCareer || ''} onChange={handleChange} className={inputClass} placeholder="Nom des établissements" />
                      </div>
                      <div>
                        <label className={labelClass}>Yéchiva Ktana / Séminaire *</label>
                        <input type="text" name="yeshivaKtana" value={formData.yeshivaKtana || ''} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Yéchiva Gdola / Études Supérieures *</label>
                        <input type="text" name="yeshivaGdola" value={formData.yeshivaGdola || ''} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Activité Actuelle *</label>
                        <select name="currentOccupation" value={formData.currentOccupation || ''} onChange={handleChange} className={inputClass}>
                          <option value="">Sélectionner...</option>
                          <option value="Limoud">Limoud (Pleine journée)</option>
                          <option value="Limoud & Travail">Limoud & Travail</option>
                          <option value="Travail">Travail (Pleine journée)</option>
                          <option value="Études">Études</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Diplômes / Formations *</label>
                        <input type="text" name="qualifications" value={formData.qualifications || ''} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description famille (Facultatif)</label>
                      <div className="bg-wedding-navy/[0.02] p-6 rounded-3xl border border-wedding-navy/5 mb-4">
                        <ul className="text-[10px] text-wedding-navy/50 font-medium space-y-1.5 list-disc pl-4 italic">
                          <li>Nombre d'enfants, situation des parents, professions...</li>
                        </ul>
                      </div>
                      <textarea
                        name="familyDescription"
                        value={formData.familyDescription || ''}
                        onChange={handleChange}
                        rows={6}
                        className={areaClass}
                        placeholder="Détaillez ici la situation de votre famille (Optionnel)..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <Star className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Vision & Ambitions</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Quels sont vos projets d'avenir ?</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <QCMGroup
                      label="Projet de vie / Carrière *"
                      name="ambitionCareer"
                      options={["Avrekh (Plein temps)", "Travail (Plein temps)", "Mi-temps", "Avrekh les premières années"]}
                    />

                    <QCMGroup
                      label="Lieu de résidence souhaité *"
                      name="ambitionLocation"
                      options={["France", "Israël", "Ouvert aux deux"]}
                      multi={false}
                    />

                    <div>
                      <label className={labelClass}>Précisions sur vos ambitions *</label>
                      <textarea
                        name="ambitions"
                        value={formData.ambitions || ''}
                        onChange={handleChange}
                        rows={4}
                        className={areaClass}
                        placeholder="Détaillez vos projets ici..."
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Kehila Fréquentée *</label>
                      <textarea
                        name="community"
                        value={formData.community || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Ex: Kehila ..., Ville, Rav ..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <ClipboardList className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Description de soi</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Comment vous définiriez-vous ?</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <QCMGroup
                        label="Est-ce que tu fumes ? *"
                        name="isSmoking"
                        options={["Non", "Oui"]}
                        multi={false}
                      />
                      <div>
                        <label className={labelClass}>Précisions (Si intermittent...)</label>
                        <input type="text" name="smokingDetails" value={formData.smokingDetails || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Très occasionnellement" />
                      </div>
                    </div>

                    <QCMGroup
                      label="Caractère & Personnalité *"
                      name="personalTraits"
                      options={["Sociable", "Réservé", "Drôle", "Calme", "Ambitieux", "Studieux", "Énergique"]}
                    />

                    <QCMGroup
                      label="Style vestimentaire (Ben Azmanim) *"
                      name="personalClothing"
                      options={["Chemise", "Kova 'Halifa", "Style Détente"]}
                    />

                    <QCMGroup
                      label="Type de téléphone *"
                      name="personalPhone"
                      options={["Neuf touches", "Xiaomi", "Smartphone", "Smartphone filtré"]}
                      multi={false}
                    />

                    <div>
                      <label className={labelClass}>Quelques mots sur vous *</label>
                      <textarea
                        name="selfDescription"
                        value={formData.selfDescription || ''}
                        onChange={handleChange}
                        rows={5}
                        className={areaClass}
                        placeholder="Parlez-nous de vous librement..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <Heart className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Recherche</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Quel profil idéal recherchez-vous ?</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <QCMGroup
                      label="Milieu familial recherché *"
                      name="searchFamily"
                      options={["Fille de maison pratiquante", "Milieu Yéchiva", "Ba’alat téchouva"]}
                    />

                    <QCMGroup
                      label="Style vestimentaire recherché *"
                      name="searchClothing"
                      options={["Classique", "Strict", "Moderne"]}
                    />

                    <QCMGroup
                      label="Type de téléphone (Pour elle) *"
                      name="searchPhone"
                      options={["Smartphone", "Neuf touches", "À discuter"]}
                    />

                    <QCMGroup
                      label="Caractère & Personnalité recherchés *"
                      name="searchTraits"
                      options={["Douce", "Joyeuse", "Sérieuse", "Simple", "Dynamique", "Organisée", "Calme", "Leader"]}
                    />

                    <QCMGroup
                      label="Ce qui vous tient le plus à cœur *"
                      name="searchPriorities"
                      options={["Physique", "Tsniout", "Téléphone Cacher", "Caractère"]}
                    />

                    <div>
                      <label className={labelClass}>Précisions sur votre recherche *</label>
                      <textarea
                        name="lookingFor"
                        value={formData.lookingFor || ''}
                        onChange={handleChange}
                        rows={6}
                        className={areaClass}
                        placeholder="Décrivez plus précisément le profil idéal..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-wedding-navy rounded-2xl flex items-center justify-center shadow-xl">
                      <Lock className="w-8 h-8 text-wedding-gold" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold text-wedding-navy">Finalisation</h3>
                      <p className="text-wedding-navy/40 text-sm font-medium italic">Accès confidentiels et contacts.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className={labelClass}>Contacts Rabbanims</label>
                      <div className="bg-wedding-navy/[0.02] p-4 rounded-3xl border border-wedding-navy/5 mb-4">
                        <p className="text-[10px] text-wedding-navy/50 font-medium italic">Donne les numéros d'un Rav de la Yechiva et d'un Rav de la kehila</p>
                      </div>
                      <textarea
                        name="rabbanimContacts"
                        value={formData.rabbanimContacts || ''}
                        onChange={handleChange}
                        rows={4}
                        className={areaClass}
                        placeholder="Ex: Rav Yechiva ..., Tél: ... / Rav Kehila ..., Tél: ..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-wedding-navy/5">
                      <div>
                        <label className={labelClass}>Email Personnel (Identifiant) *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={`${inputClass} pl-12`} placeholder="votre@email.com" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Code d'accès (Mot de passe) *</label>
                        <div className="relative">
                          <Key className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="text" name="accessCode" value={formData.accessCode || ''} onChange={handleChange} className={`${inputClass} pl-12`} placeholder="Ex: 5678" />
                        </div>
                        <p className="text-[9px] text-wedding-navy/30 mt-2 italic font-medium">Ce code vous servira à vous reconnecter.</p>
                      </div>
                    </div>

                    <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-gold/20 flex gap-4">
                      <Info className="w-6 h-6 text-wedding-gold shrink-0" />
                      <p className="text-[10px] text-wedding-navy/60 leading-relaxed font-medium">
                        En validant votre inscription, vous rejoignez la communauté Lev Echad. Vos informations sont traitées avec la plus grande discrétion par nos Shadchanim.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="p-10 border-t border-wedding-navy/5 bg-white/50 backdrop-blur-md flex justify-between items-center shrink-0">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-wedding-navy/40 hover:text-wedding-navy hover:bg-wedding-navy/5 transition-all text-xs uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-3 px-12 py-5 bg-wedding-navy text-white rounded-2xl font-bold shadow-[0_10px_30px_rgba(10,24,42,0.2)] hover:shadow-wedding-navy/30 transition-all transform hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest border border-wedding-gold/20"
          >
            {currentStep === STEPS.length ? (
              <>
                {initialData ? "Sauvegarder les modifications" : "Finaliser mon inscription"}
                <Save className="w-4 h-4 text-wedding-gold" />
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4 text-wedding-gold" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;