import { Profile, MatchSuggestion, ReligiousLevel, Gender, MatchingCriteria } from '../types';

interface MatchingResult {
  suggestions: MatchSuggestion[];
}

function parseHeight(heightStr: string): number {
  if (!heightStr) return 0;
  const clean = heightStr.toLowerCase().replace(/[^0-9m]/g, '');
  
  // Format: 1m80
  if (clean.includes('m')) {
    const parts = clean.split('m');
    const m = parseInt(parts[0]) || 0;
    const cm = parseInt(parts[1]) || 0;
    return m * 100 + cm;
  }
  
  // Format: 180 (cm)
  const val = parseInt(clean);
  if (val > 100 && val < 250) return val; // Assume CM
  if (val > 0 && val < 3) return val * 100; // Assume Meters dotless? Unlikely but possible

  return 0;
}

/**
 * Calculates a compatibility score between two profiles based on deterministic rules.
 */
function calculateCompatibility(p1: Profile, p2: Profile): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  // 1. Gender check (Fundamental)
  if (p1.gender === p2.gender) {
    return { score: 0, reasons: ['Même genre'] };
  }

  // 2. Hashkafa Alignment (30 points)
  if (p1.religiousLevel === p2.religiousLevel) {
    score += 30;
    reasons.push('Hashkafa identique');
  } else {
    score += 5; 
    reasons.push('Hashkafa différente mais potentiellement compatible');
  }

  // 3. Age Logic (20 points)
  const ageDiff = p1.gender === Gender.MALE ? p1.age - p2.age : p2.age - p1.age;
  if (ageDiff >= -2 && ageDiff <= 7) {
    score += 20;
    reasons.push('Différence d\'âge idéale');
  } else {
    score += 5;
  }

  // 4. City (15 points)
  if (p1.city.toLowerCase() === p2.city.toLowerCase()) {
    score += 15;
    reasons.push('Même ville');
  } else {
      reasons.push('Villes différentes');
  }

  // 5. Height (15 points) - Boy taller preference
  const p1Height = parseHeight(p1.height);
  const p2Height = parseHeight(p2.height);
  if (p1Height > 0 && p2Height > 0) {
      const boyHeight = p1.gender === Gender.MALE ? p1Height : p2Height;
      const girlHeight = p1.gender === Gender.FEMALE ? p1Height : p2Height;
      
      if (boyHeight >= girlHeight) {
          score += 15;
      }
  } else {
     score += 10; // Neutral if height unknown
  }

  // 6. Text Matching (20 points) - Directional (Reverse Matching)
  const keywords = ['torah', 'hessed', 'famille', 'voyage', 'étude', 'sport', 'moderne', 'sérieux', 'ambitieux', 'shabbat', 'casher'];

  // Did P2 mention what P1 is looking for?
  const p1Looking = p1.lookingFor.toLowerCase();
  const p2About = p2.aboutMe.toLowerCase();
  const p1Satisfaction = keywords.filter(k => p1Looking.includes(k) && p2About.includes(k)).length;

  // Did P1 mention what P2 is looking for?
  const p2Looking = p2.lookingFor.toLowerCase();
  const p1About = p1.aboutMe.toLowerCase();
  const p2Satisfaction = keywords.filter(k => p2Looking.includes(k) && p1About.includes(k)).length;

  if (p1Satisfaction > 0 || p2Satisfaction > 0) {
    // We give points if there is mutual satisfaction or strong one-way
    const totalMatches = p1Satisfaction + p2Satisfaction;
    score += Math.min(20, totalMatches * 5);
    
    if (p1Satisfaction > 0 && p2Satisfaction > 0) {
       reasons.push(`Intérêts mutuels: ${totalMatches} points communs`);
    } else {
       reasons.push(`Correspondance partielle des critères`);
    }
  }

  // 7. Languages (10 points)
  if (p1.languages && p2.languages) {
      const commonLangs = p1.languages.filter(l => p2.languages?.includes(l));
      if (commonLangs.length > 0) {
          score += 10;
          reasons.push(`Langues communes: ${commonLangs.join(', ')}`);
      }
  }

  // 8. Aliyah Status (Bonus 5)
  if (p1.aliyahStatus && p2.aliyahStatus && p1.aliyahStatus === p2.aliyahStatus) {
      score += 5;
  }

  return { score: Math.min(score, maxScore), reasons };
}

export const findMatchesForProfile = async (
  targetProfile: Profile,
  allProfiles: Profile[],
  criteria?: MatchingCriteria
): Promise<MatchingResult> => {
  
  // Simulate network delay for "processing" feel
  await new Promise(resolve => setTimeout(resolve, 800));

  const suggestions: MatchSuggestion[] = allProfiles
    .filter(p => {
        // Basic Exclusion
        if (p.id === targetProfile.id) return false;
        if (p.gender === targetProfile.gender) return false;

        // Strict Filters
        if (criteria) {
            if (criteria.minAge && p.age < criteria.minAge) return false;
            if (criteria.maxAge && p.age > criteria.maxAge) return false;

            if (criteria.preferredHashkafa && criteria.preferredHashkafa.length > 0) {
                if (!criteria.preferredHashkafa.includes(p.religiousLevel)) return false;
            }

            if (criteria.occupation && !p.occupation.toLowerCase().includes(criteria.occupation.toLowerCase())) return false;

            if (criteria.minHeight || criteria.maxHeight) {
                const h = parseHeight(p.height);
                if (h > 0) {
                    if (criteria.minHeight && h < criteria.minHeight) return false;
                    if (criteria.maxHeight && h > criteria.maxHeight) return false;
                }
            }

            if (criteria.aliyahStatus && p.aliyahStatus !== criteria.aliyahStatus) return false;
            
            if (criteria.languages && criteria.languages.length > 0) {
                // Must share at least one language from criteria
                const hasLang = p.languages?.some(l => criteria.languages?.includes(l));
                if (!hasLang) return false;
            }
        }
        return true;
    })
    .map(candidate => {
      const { score, reasons } = calculateCompatibility(targetProfile, candidate);
      return {
        candidateId: candidate.id,
        matchPercentage: score,
        reasoning: reasons.join('. ')
      };
    })
    .filter(s => s.matchPercentage > (criteria?.minScore || 40)) // Filter out low quality matches
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return { suggestions };
};
