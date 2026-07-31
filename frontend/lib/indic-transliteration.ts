'use client'

/**
 * Phonetic map for English (Latin) to Devanagari script for Marathi & Hindi
 */
const CONSONANTS: Record<string, string> = {
  kh: 'ख', gh: 'घ', ch: 'च', chh: 'छ', jh: 'झ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ', sh: 'श', shh: 'ष',
  k: 'क', g: 'ग', j: 'ज', t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
  s: 'स', h: 'ह', L: 'ळ', N: 'ण', T: 'ट', D: 'ड'
}

const VOWELS: Record<string, string> = {
  aa: 'आ', ee: 'ई', oo: 'ऊ', ai: 'ऐ', au: 'औ', a: 'अ', i: 'इ', u: 'उ', e: 'ए', o: 'ओ'
}

const MATRAS: Record<string, string> = {
  aa: 'ा', ee: 'ी', oo: 'ू', ai: 'ै', au: 'ौ', a: '', i: 'ि', u: 'ु', e: 'े', o: 'ो'
}

/**
 * Transliterate Latin phonetics to Marathi/Hindi Devanagari
 * e.g., "taap" -> "ताप", "dukhne" -> "दुखणे", "madat" -> "मदत"
 */
export function transliterateToDevanagari(input: string, lang: 'mr' | 'hi' = 'mr'): string {
  if (!input) return ''

  // Common medical/healthcare phonetic dictionary overrides for speed and precision
  const DICTIONARY: Record<string, string> = {
    taap: 'ताप',
    fever: 'ताप',
    dukhne: 'दुखणे',
    dard: 'दर्द',
    madat: 'मदत',
    help: 'मदत',
    palaan: 'पलायन',
    sardi: 'सर्दी',
    khokla: 'खोकला',
    khansi: 'खांसी',
    chakkar: 'चक्कर',
    gira: 'गिर पडले',
    unconscious: 'बेहोष',
    chhati: 'छाती',
    shwas: 'श्वास',
    raat: 'रात्र',
    sakali: 'सकाळी',
    jiv: 'जीव',
    doke: 'डोके',
    sar: 'सर',
  }

  const words = input.toLowerCase().split(/(\s+)/)
  return words.map(word => {
    const cleanWord = word.trim()
    if (!cleanWord) return word
    if (DICTIONARY[cleanWord]) return DICTIONARY[cleanWord]

    // Simple rule-based phonetic engine fallback
    let res = ''
    let i = 0
    while (i < cleanWord.length) {
      // 3-char match
      const c3 = cleanWord.substring(i, i + 3)
      if (CONSONANTS[c3]) {
        res += CONSONANTS[c3]
        i += 3
        continue
      }
      // 2-char match
      const c2 = cleanWord.substring(i, i + 2)
      if (CONSONANTS[c2]) {
        res += CONSONANTS[c2]
        i += 2
        continue
      }
      if (MATRAS[c2] !== undefined && i > 0) {
        res += MATRAS[c2]
        i += 2
        continue
      }
      if (VOWELS[c2]) {
        res += VOWELS[c2]
        i += 2
        continue
      }

      // 1-char match
      const c1 = cleanWord[i]
      if (CONSONANTS[c1]) {
        res += CONSONANTS[c1]
      } else if (MATRAS[c1] !== undefined && i > 0) {
        res += MATRAS[c1]
      } else if (VOWELS[c1]) {
        res += VOWELS[c1]
      } else {
        res += c1
      }
      i++
    }
    return res
  }).join('')
}
