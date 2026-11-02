import wordsDictionary from "../constants/words_dictionary.json";

const safeWords = Array.isArray(wordsDictionary) ? wordsDictionary : [];

const DICTIONARY_SET = new Set<string>(
  safeWords.map((w: string) => String(w).toLowerCase().trim()),
);

// 🚫 ALLOWED 2-LETTER WORDS (Expanded to include QI, JO, etc.)
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
  "qi",
  "jo",
  "ox",
  "pi",
  "ex",
  "ax",
  "za",
]);

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
]);

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

// 🛡️ Whitelist for specific valid words/inflections missing from base json
const CUSTOM_ALLOWED_WORDS = new Set([
  "forage",
  "foraged",
  "foraging",
  "forager",
  "foragers",
  "forages",
]);

export function isValidWord(word: string): boolean {
  if (!word) return false;

  const lowerWord = word.trim().toLowerCase();

  if (lowerWord.length < 2) return false;
  if (!/^[a-z]+$/.test(lowerWord)) return false;

  if (lowerWord.length === 2) {
    return ALLOWED_TWO_LETTER_WORDS.has(lowerWord);
  }

  if (BLOCKED_WORDS.has(lowerWord) || BLOCKED_ACRONYMS.has(lowerWord)) {
    return false;
  }

  if (!/[aeiouy]/.test(lowerWord)) return false;
  if (/[^aeiouy]{4,}/.test(lowerWord)) return false;

  // 🔒 Strict validation: Must exist directly in your dictionary or custom list
  if (CUSTOM_ALLOWED_WORDS.has(lowerWord)) return true;
  if (DICTIONARY_SET.has(lowerWord)) return true;

  return false;
}
