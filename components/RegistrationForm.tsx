import React, { useState } from 'react';
import { Gender, ReligiousLevel, Profile } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Save, ChevronRight, ChevronLeft, Check, User, Key, Mail, Phone, Calendar, MapPin, Users, Heart, GraduationCap, ClipboardList, Info, Star, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/dataService';

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
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 5Mo)");
      return;
    }

    setIsUploading(true);
    try {
      const url = await api.uploadFile('profiles', file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploading(false);
    }
  };

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
        return !!(formData.lastName && formData.firstName && formData.birthDate && formData.contactPhone && isValidPhone(formData.contactPhone) && formData.height && formData.skinColor && formData.eyeColor && formData.hairColor && formData.bodyType);
      case 2:
        return !!(formData.fatherName && formData.motherName && formData.fatherPhone && formData.motherPhone && isValidPhone(formData.fatherPhone!) && isValidPhone(formData.motherPhone!) && formData.parentsOrigin);
      case 3:
        return !!(formData.primarySchool && formData.middleSchool && formData.highSchool && formData.yeshivaKtana && formData.yeshivaGdola && formData.currentOccupation);
      case 4:
        return !!(formData.ambitionCareer && formData.ambitionLocation && (formData.ambitions || !formData.ambitionCareer) && (formData.community || !formData.ambitionLocation));
      case 5:
        return true; // All fields are optional for this step
      case 6:
        return !!(formData.searchFamily && formData.searchClothing && formData.searchPhone && formData.searchTraits && formData.searchPriorities && formData.lookingFor);
      case 7:
        return !!(formData.email && formData.accessCode && isValidEmail(formData.email) && formData.ravYeshiva && formData.ravKehila);
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
      imageUrl: formData.imageUrl,
      createdAt: initialData?.createdAt || Date.now()
    } as Profile;

    onSave(newProfile);

    // Create a notification for the shadchan
    api.createNotification({
      type: 'PROFILE_NEW',
      content: `Nouveau candidat inscrit : ${newProfile.firstName} ${newProfile.lastName} (${newProfile.city})`
    }).catch(console.error);
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

  const inputClass = "mt-1 block w-full rounded-2xl border-2 border-wedding-navy/10 bg-white px-4 md:px-6 py-3.5 md:py-4 text-wedding-navy placeholder:text-wedding-navy/40 focus:border-wedding-gold/50 focus:ring-4 focus:ring-wedding-gold/5 transition-all duration-300 font-medium text-sm md:text-base shadow-sm";
  const areaClass = "mt-1 block w-full rounded-2xl border-2 border-wedding-navy/10 bg-white px-4 md:px-6 py-4 md:py-5 text-wedding-navy placeholder:text-wedding-navy/40 focus:border-wedding-gold/50 focus:ring-4 focus:ring-wedding-gold/5 transition-all duration-300 font-medium text-sm md:text-base shadow-sm resize-none";
  const labelClass = "block text-[11px] md:text-[13px] font-bold text-wedding-navy/80 uppercase tracking-wider md:tracking-[0.15em] mb-2 md:mb-2.5 ml-1";

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
    <div className="bg-white rounded-[2rem] shadow-2xl border border-wedding-navy/5 overflow-hidden max-w-[1400px] w-full mx-auto flex flex-col lg:flex-row min-h-[auto] lg:min-h-[850px] transition-all my-4 lg:my-0">

      {/* Sidebar Navigation */}
      <div className="bg-wedding-navy text-white p-6 lg:p-12 lg:w-96 flex flex-col lg:pt-20 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-wedding-gold rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-center lg:block">
            <button onClick={onCancel} className="lg:mb-10 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest leading-none">
              <ChevronLeft className="w-4 h-4 text-wedding-gold" /> <span className="hidden lg:inline">Accueil</span>
            </button>
            <div className="lg:hidden text-[10px] font-bold text-wedding-gold uppercase tracking-[0.2em]">Étape {currentStep}/{STEPS.length}</div>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-4xl font-serif font-bold mb-3 leading-tight">Binyan Adei Ad</h2>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em] mb-16 italic">Votre futur commence ici</p>
          </div>

          <div className="hidden lg:block space-y-4 flex-1">
            {STEPS.map(step => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const canClick = isCompleted || initialData || isActive;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (canClick) setCurrentStep(step.id);
                  }}
                  disabled={!canClick}
                  className={`flex items-start gap-5 w-full text-left transition-all duration-500 ${isActive ? 'opacity-100 translate-x-2' : canClick ? 'opacity-50 hover:opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500 ${isActive ? 'bg-wedding-gold text-wedding-navy shadow-xl shadow-wedding-gold/20 scale-110 rotate-3' : 'bg-white/5 text-white'}`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em]">{step.title}</div>
                    <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-0.5">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:hidden mt-4 bg-white/10 h-1 rounded-full overflow-hidden">
            <div className="bg-wedding-gold h-full transition-all duration-1000" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
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
      <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
        <div className="p-6 md:p-12 lg:p-16 flex-1 flex flex-col">
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

                  <div className="bg-wedding-navy/5 p-4 rounded-xl border border-wedding-navy/10 flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Lock className="w-4 h-4 text-wedding-navy" />
                    </div>
                    <p className="text-sm text-wedding-navy/80 leading-relaxed font-medium">
                      <strong className="block text-wedding-navy mb-0.5 text-xs uppercase tracking-wider">Confidentialité Maximale</strong>
                      Seul le Shadchan ou la Shadchanit qui s'occupe de votre dossier pourra voir ces informations. Elles restent strictement confidentielles.
                    </p>
                  </div>

                  {/* Photo Upload - Optional */}
                  <div className="bg-white p-6 rounded-2xl border border-wedding-navy/10 shadow-sm">
                    <label className={labelClass}>Photo de profil (Optionnel)</label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-2xl bg-wedding-navy/5 border-2 border-dashed border-wedding-navy/10 flex items-center justify-center overflow-hidden group hover:border-wedding-gold/50 transition-colors">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-wedding-navy/20 group-hover:text-wedding-gold/50 transition-colors" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-wedding-navy/60
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-xl file:border-0
                            file:text-[10px] file:font-bold file:uppercase file:tracking-widest
                            file:bg-wedding-navy file:text-white
                            hover:file:bg-wedding-navy/90
                            file:cursor-pointer cursor-pointer
                            transition-all
                          "
                        />
                        <p className="mt-2 text-[10px] text-wedding-navy/40 font-medium italic">
                          Une photo aide les Shadchanim à mieux se souvenir de vous. (JPG, PNG. Max 5Mo)
                        </p>
                      </div>
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
                        <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} />
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
                        <input type="text" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="06 XX XX XX XX" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Ville de résidence *</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                        <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="Ville actuelle" />
                      </div>
                    </div>

                    <div className="md:col-span-2 border-t border-wedding-navy/5 pt-8 mt-4">
                      <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] mb-6">Description Physique</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className={labelClass}>Morphologie *</label>
                          <select name="bodyType" value={formData.bodyType || ''} onChange={handleChange} className={inputClass} required>
                            <option value="">Sélectionner...</option>
                            <option value="Mince">Mince</option>
                            <option value="Normale">Normale</option>
                            <option value="Sportive">Sportive</option>
                            <option value="Ronde">Ronde</option>
                            <option value="Forte">Forte</option>
                          </select>
                        </div>
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

                    <div className="md:col-span-2 space-y-6 pt-4 border-t border-wedding-navy/5">
                      <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em] border-b border-wedding-navy/5 pb-2">Origines</h4>
                      <div>
                        <label className={labelClass}>Origine des parents *</label>
                        <input
                          type="text"
                          name="parentsOrigin"
                          value={formData.parentsOrigin || ''}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Ex: Maroc, Pologne, Tunisie, etc."
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Rite / Noussa'h *</label>
                        <select name="nusach" value={formData.nusach || ''} onChange={handleChange} className={inputClass}>
                          <option value="">Sélectionner...</option>
                          <option value="Ashkenaze">Ashkenaze</option>
                          <option value="Sefarade">Sefarade</option>
                          <option value="Edot Hamizrah">Edot Hamizrah</option>
                          <option value="Hassidique">Hassidique</option>
                          <option value="Autre">Autre</option>
                        </select>
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
                        <label className={labelClass}>École Primaire *</label>
                        <input type="text" name="primarySchool" value={formData.primarySchool || ''} onChange={handleChange} className={inputClass} placeholder="Nom de l'école" />
                      </div>
                      <div>
                        <label className={labelClass}>Collège *</label>
                        <input type="text" name="middleSchool" value={formData.middleSchool || ''} onChange={handleChange} className={inputClass} placeholder="Nom du collège" />
                      </div>
                      <div>
                        <label className={labelClass}>Lycée *</label>
                        <input type="text" name="highSchool" value={formData.highSchool || ''} onChange={handleChange} className={inputClass} placeholder="Nom du lycée" />
                      </div>
                      <div>
                        <label className={labelClass}>{formData.gender === Gender.MALE ? 'Yéchiva Ktana' : 'Séminaire'} *</label>
                        <div className="flex gap-2">
                             <input type="text" name="yeshivaKtana" value={formData.yeshivaKtana || ''} onChange={handleChange} className={inputClass} placeholder="Nom ou 'Peu importe'" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>{formData.gender === Gender.MALE ? 'Yéchiva Gdola' : 'Post-Séminaire / Études'} *</label>
                        <div className="flex gap-2">
                            <input type="text" name="yeshivaGdola" value={formData.yeshivaGdola || ''} onChange={handleChange} className={inputClass} placeholder="Nom ou 'Peu importe'" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Activité Actuelle *</label>
                        <select name="currentOccupation" value={formData.currentOccupation || ''} onChange={handleChange} className={inputClass}>
                          <option value="">Sélectionner...</option>
                          {formData.gender === Gender.MALE ? (
                            <>
                              <option value="Limoud">Limoud (Pleine journée)</option>
                              <option value="Limoud & Travail">Limoud & Travail</option>
                              <option value="Travail">Travail (Pleine journée)</option>
                              <option value="Études">Études</option>
                            </>
                          ) : (
                            <>
                              <option value="Études">Études (Pleine journée)</option>
                              <option value="Travail">Travail (Pleine journée)</option>
                              <option value="Études & Travail">Études & Travail</option>
                              <option value="Recherche d'emploi">Recherche d'emploi</option>
                              <option value="Foyer">Foyer</option>
                            </>
                          )}
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

                    <div>
                        <label className={labelClass}>Niveau Religieux *</label>
                        <select name="religiousLevel" value={formData.religiousLevel || ''} onChange={handleChange} className={inputClass}>
                          <option value={ReligiousLevel.YESHIVISH}>Yeshivish</option>
                          <option value={ReligiousLevel.MODERN_ORTHODOX}>Moderne Orthodoxe</option>
                          <option value={ReligiousLevel.CHASSIDISH}>Hassidique</option>
                          <option value={ReligiousLevel.DATI_LEUMI}>Dati Leumi</option>
                          <option value={ReligiousLevel.TRADITIONAL}>Traditionaliste</option>
                          <option value={ReligiousLevel.BAAL_TESHUVA}>Baal Teshuva</option>
                        </select>
                    </div>

                    <QCMGroup
                      label={`Projet de vie / Carrière ${formData.gender === Gender.MALE ? '(Pour vous)' : '(Ce que vous recherchez)'} *`}
                      name="ambitionCareer"
                      options={formData.gender === Gender.MALE
                        ? ["Avrekh (Plein temps)", "Travail (Pleine temps)", "Mi-temps", "Avrekh les premières années"]
                        : ["Mari Avrekh", "Mari qui travaille", "Mari qui étudie et travaille", "Mari Avrekh au début"]}
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
                        label="Est-ce que tu fumes ?"
                        name="isSmoking"
                        options={["Non", "Oui"]}
                        multi={false}
                      />
                      <div>
                        <label className={labelClass}>Précisions (Si intermittent...)</label>
                        <input type="text" name="smokingDetails" value={formData.smokingDetails || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Très occasionnellement" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <QCMGroup
                        label="Caractère & Personnalité"
                        name="personalTraits"
                        options={["Sociable", "Réservé", "Drôle", "Calme", "Ambitieux", "Studieux", "Énergique", "Intellectuelle", "Sérieux"]}
                      />
                      <textarea
                        name="personalTraitsDetails"
                        value={formData.personalTraitsDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre caractère (Facultatif)..."
                      />
                    </div>

                    <div className="space-y-6">
                      <QCMGroup
                        label="Style vestimentaire (Ben Azmanim / Quotidien)"
                        name="personalClothing"
                        options={formData.gender === Gender.MALE
                          ? ["Chemise", "Kova 'Halifa", "Style Détente", "Moderne"]
                          : ["Tzniout Classique", "Tzniout Moderne", "Strict", "Décontracté"]}
                      />
                      <textarea
                        name="personalClothingDetails"
                        value={formData.personalClothingDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre style (Facultatif)..."
                      />
                    </div>

                    {formData.gender === Gender.FEMALE && (
                      <div className="space-y-6">
                        <QCMGroup
                          label="Couvre-Chef (Après mariage)"
                          name="headCoveringPreference"
                          options={["Foulard", "Perruque", "Foulard & Perruque", "Ne sait pas encore"]}
                          multi={false}
                        />
                      </div>
                    )}

                    <div className="space-y-6">
                      <QCMGroup
                        label="Type de téléphone"
                        name="personalPhone"
                        options={["Neuf touches", "Xiaomi", "Smartphone", "Smartphone filtré"]}
                        multi={false}
                      />
                      <textarea
                        name="personalPhoneDetails"
                        value={formData.personalPhoneDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre téléphone (Facultatif)..."
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Quelques mots sur vous</label>
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
                    <div className="space-y-6">
                      <QCMGroup
                        label="Milieu familial recherché *"
                        name="searchFamily"
                        options={formData.gender === Gender.MALE
                          ? ["Fille de maison pratiquante", "Milieu Yéchiva", "Ba’alat téchouva", "Torani"]
                          : ["Famille Torah", "Famille Moderne", "Baal Téchouva", "Ouverte"]}
                      />
                      <textarea
                        name="searchFamilyDetails"
                        value={formData.searchFamilyDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre milieu (Facultatif)..."
                      />
                    </div>

                    <div className="space-y-6">
                         <label className={labelClass}>Origine / Rite recherché</label>
                         <QCMGroup
                            label="Rite / Noussa'h"
                            name="searchNusach"
                            options={["Ashkenaze", "Sefarade", "Edot Hamizrah", "Hassidique", "Peu importe"]}
                         />
                    </div>

                    {formData.gender === Gender.MALE && (
                        <div className="space-y-8 border-t border-wedding-navy/5 pt-6">
                            <h4 className="text-[10px] font-bold text-wedding-navy/30 uppercase tracking-[0.2em]">Critères Spécifiques (Pour Elle)</h4>
                            
                            <div>
                                <label className={labelClass}>Métier souhaité</label>
                                <input type="text" name="lookingForJob" value={formData.lookingForJob || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Enseignante, Libérale,..." />
                            </div>
                            <div>
                                <label className={labelClass}>Hachkafot souhaitées</label>
                                <input type="text" name="lookingForHashkafa" value={formData.lookingForHashkafa || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Ouverte, Torani,..." />
                            </div>
                             <div>
                                <label className={labelClass}>Niveau de Yirat Shamayim</label>
                                <input type="text" name="lookingForYiratShamayim" value={formData.lookingForYiratShamayim || ''} onChange={handleChange} className={inputClass} placeholder="Ex: Très pointilleuse, ..." />
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                      <QCMGroup
                        label="Style vestimentaire recherché (Pour l'autre) *"
                        name="searchClothing"
                        options={formData.gender === Gender.MALE
                          // Male searches for female style
                          ? ["Tzniout Classique", "Tzniout Moderne", "Strict", "Peu importe"]
                          // Female searches for male style
                          : ["Kova 'Halifa (Toujours)", "Chemise (Shabbat)", "Kippa Serouga", "Peu importe"]}
                      />
                      <textarea
                        name="searchClothingDetails"
                        value={formData.searchClothingDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre style (Facultatif)..."
                      />
                    </div>

                    <div className="space-y-6">
                      <QCMGroup
                        label={`Type de téléphone (Souhaité pour ${formData.gender === Gender.MALE ? 'elle' : 'lui'}) *`}
                        name="searchPhone"
                        options={["Smartphone", "Neuf touches", "À discuter"]}
                      />
                      <textarea
                        name="searchPhoneDetails"
                        value={formData.searchPhoneDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre téléphone (Facultatif)..."
                      />
                    </div>

                    <div className="space-y-6">
                       <QCMGroup
                         label={`WhatsApp / Réseaux Sociaux (Possédé par ${formData.gender === Gender.MALE ? 'elle' : 'lui'}) *`}
                         name="searchSocial"
                         options={["Avec", "Sans", "Peu importe"]}
                       />
                    </div>

                    <div className="space-y-6">
                       <QCMGroup
                         label="Caractère & Personnalité recherchés *"
                         name="searchTraits"
                         options={formData.gender === Gender.MALE
                           ? ["Douce", "Joyeuse", "Sérieuse", "Simple", "Dynamique", "Organisée", "Calme", "Leader", "Intellectuelle", "Drôle", "Peu importe"]
                           : ["Doux", "Joyeux", "Sérieux", "Simple", "Dynamique", "Organisé", "Calme", "Leader", "Intellectuel", "Drôle", "Peu importe"]}
                       />
                      <textarea
                        name="searchTraitsDetails"
                        value={formData.searchTraitsDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autre caractère (Facultatif)..."
                      />
                    </div>

                    <div className="space-y-6">
                      <QCMGroup
                        label="Ce qui vous tient le plus à cœur *"
                        name="searchPriorities"
                        options={formData.gender === Gender.MALE
                          ? ["Physique", "Tsniout", "Midot", "Caractère"]
                          : ["Physique", "Étude de la Torah", "Middot", "Caractère"]}
                      />
                      <textarea
                        name="searchPrioritiesDetails"
                        value={formData.searchPrioritiesDetails || ''}
                        onChange={handleChange}
                        rows={2}
                        className={areaClass}
                        placeholder="Précisions ou Autres priorités (Facultatif)..."
                      />
                    </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className={labelClass}>Rav de la Yéchiva *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="text" name="ravYeshiva" value={formData.ravYeshiva || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="Nom et Téléphone" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Rav de la Kehila *</label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="text" name="ravKehila" value={formData.ravKehila || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="Nom et Téléphone" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-wedding-navy/5">
                      <div>
                        <label className={labelClass}>Email Personnel (Identifiant) *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="votre@email.com" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Code d'accès (Mot de passe) *</label>
                        <div className="relative">
                          <Key className="w-4 h-4 text-wedding-gold absolute left-4 top-1/2 -translate-y-1/2" />
                          <input type="text" name="accessCode" value={formData.accessCode || ''} onChange={handleChange} className={`${inputClass} pl-12 md:pl-12`} placeholder="Ex: 5678" />
                        </div>
                        <p className="text-[9px] text-wedding-navy/30 mt-2 italic font-medium">Ce code vous servira à vous reconnecter.</p>
                      </div>
                    </div>

                    <div className="bg-wedding-navy/5 p-6 rounded-3xl border border-wedding-gold/20 flex gap-4">
                      <Info className="w-6 h-6 text-wedding-gold shrink-0" />
                      <p className="text-[10px] text-wedding-navy/60 leading-relaxed font-medium">
                        En validant votre inscription, vous rejoignez la communauté Binyan Adei Ad. Vos informations sont traitées avec la plus grande discrétion par nos Shadchanim.
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