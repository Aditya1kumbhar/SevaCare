export const emergencyKeywords: Record<string, string[]> = {
  english: ['help', 'fall', 'pain', 'bleeding', 'chest pain', 'breathless', 'unconscious'],
  hindi: ['गिर गया', 'दर्द', 'मदद', 'सांस नहीं', 'छाती में दर्द', 'बेहोश', 'खून'],
  marathi: ['पडलो', 'वेदना', 'मदत', 'श्वास', 'छातीत दुखणे'],
};

export const symptomKeywords: Record<string, string[]> = {
  english: ['fever', 'headache', 'dizzy', 'nausea', 'cough', 'weakness'],
  hindi: ['बुखार', 'सिरदर्द', 'चक्कर', 'उल्टी', 'खांसी', 'कमजोरी'],
  marathi: ['ताप', 'डोकेदुखी', 'चक्कर', 'मळमळ', 'खोकला'],
};

export function getLanguageCode(lang: string): string {
  const lowercaseLang = lang.toLowerCase();
  switch (lowercaseLang) {
    case 'english':
      return 'en-IN';
    case 'hindi':
      return 'hi-IN';
    case 'marathi':
      return 'mr-IN';
    default:
      return 'en-IN';
  }
}

export function analyzeTranscript(text: string, lang: string): { type: 'emergency' | 'symptom' | 'unknown', keywords: string[], confidence: number } {
  const lowerText = text.toLowerCase();
  const lowercaseLang = lang.toLowerCase();
  
  const langEmergency = emergencyKeywords[lowercaseLang] || emergencyKeywords.english;
  const langSymptom = symptomKeywords[lowercaseLang] || symptomKeywords.english;

  const foundEmergency = langEmergency.filter(kw => lowerText.includes(kw.toLowerCase()));
  const foundSymptom = langSymptom.filter(kw => lowerText.includes(kw.toLowerCase()));

  if (foundEmergency.length > 0) {
    return {
      type: 'emergency',
      keywords: foundEmergency,
      confidence: Math.min(0.5 + (foundEmergency.length * 0.2), 1.0)
    };
  }

  if (foundSymptom.length > 0) {
    return {
      type: 'symptom',
      keywords: foundSymptom,
      confidence: Math.min(0.4 + (foundSymptom.length * 0.2), 1.0)
    };
  }

  return {
    type: 'unknown',
    keywords: [],
    confidence: 0.1
  };
}
