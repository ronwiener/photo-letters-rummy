import wordsDictionary from "../constants/words_dictionary.json";

// Type assertion for the imported JSON dictionary object
const dictionary = wordsDictionary as Record<string, number>;

// 🚫 BLOCKED ACRONYMS LIST
export const BLOCKED_ACRONYMS = new Set<string>([
  "tba",
  "eta",
  "fyi",
  "asap",
  "diy",
  "faq",
  "ceo",
  "cfo",
  "cto",
  "dob",
  "rsvp",
  "vip",
  "aka",
]);

// 🚫 BLOCKED WORDS LIST
// Add obscure dictionary entries or unwanted AI words here as they pop up
const BLOCKED_WORDS = new Set<string>([
  "esere",
  "danli",
  "oie",
  "aa",
  "qi",
  "xu",
  "za",
]);

export function isValidWord(word: string): boolean {
  if (!word) return false;

  const lowerWord = word.trim().toLowerCase();

  // 1. Minimum word length rule (Rummy standard: at least 3 letters)
  if (lowerWord.length < 3) return false;

  // 2. Reject if string contains non-alphabetic characters (e.g., numbers or unassigned wild cards)
  if (!/^[a-z]+$/.test(lowerWord)) {
    return false;
  }

  // 3. Reject blocked words / non-word acronyms
  if (BLOCKED_WORDS.has(lowerWord) || BLOCKED_ACRONYMS?.has(lowerWord)) {
    return false;
  }

  // 4. Reject consonant clusters without a vowel or 'y' (e.g., "rwd", "tsi", "bdf")
  const hasVowel = /[aeiouy]/.test(lowerWord);
  if (!hasVowel) return false;

  // 5. Reject words with 4 or more consecutive consonants (e.g., "zzzg", "bcdf")
  const hasExcessiveConsonants = /[^aeiouy]{4,}/.test(lowerWord);
  if (hasExcessiveConsonants) return false;

  // 6. Check dictionary lookup (Ensure dictionary is loaded & lowerWord exists)
  return Boolean(dictionary && dictionary[lowerWord] === 1);
}
