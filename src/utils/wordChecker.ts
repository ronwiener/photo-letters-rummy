import wordsDictionary from "../constants/words_dictionary.json";

// Convert flat JSON array into a Set for ultra-fast O(1) lookups
const DICTIONARY_SET = new Set<string>(
  Array.isArray(wordsDictionary)
    ? wordsDictionary.map((w: string) => w.toLowerCase().trim())
    : [],
);

// 🚫 ALLOWED 2-LETTER WORDS (Strict whitelist of common English 2-letter words)
const ALLOWED_TWO_LETTER_WORDS = new Set<string>([
  "am",
  "an",
  "as",
  "at",
  "be",
  "by",
  "do",
  "go",
  "he",
  "hi",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "no",
  "of",
  "on",
  "or",
  "so",
  "to",
  "up",
  "us",
  "we",
]);

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
  "atm",
  "pms",
  "gmo",
]);

// 🚫 BLOCKED OBSOLETE / UNCOMMON WORDS
const BLOCKED_WORDS = new Set<string>([
  "esere",
  "danli",
  "oie",
  "steth",
  "zax",
  "qat",
  "pyx",
  "cwm",
]);

export function isValidWord(word: string): boolean {
  if (!word) return false;

  const lowerWord = word.trim().toLowerCase();

  // 1. Minimum word length rule
  if (lowerWord.length < 2) return false;

  // 2. Reject if string contains non-alphabetic characters
  if (!/^[a-z]+$/.test(lowerWord)) {
    return false;
  }

  // 3. Strict 2-letter validation: Only allow standard, recognizable 2-letter words
  if (lowerWord.length === 2) {
    return ALLOWED_TWO_LETTER_WORDS.has(lowerWord);
  }

  // 4. Reject blocked words / non-word acronyms
  if (BLOCKED_WORDS.has(lowerWord) || BLOCKED_ACRONYMS.has(lowerWord)) {
    return false;
  }

  // 5. Reject consonant clusters without a vowel or 'y' (e.g., "rwd", "tsi")
  const hasVowel = /[aeiouy]/.test(lowerWord);
  if (!hasVowel) return false;

  // 6. Reject words with 4 or more consecutive consonants
  const hasExcessiveConsonants = /[^aeiouy]{4,}/.test(lowerWord);
  if (hasExcessiveConsonants) return false;

  // 7. Check dictionary lookup using Set.has()
  return DICTIONARY_SET.has(lowerWord);
}
