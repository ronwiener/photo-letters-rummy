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
  "qi",
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

// 🛡️ Whitelist for common inflections/words missing from base dictionary
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

  if (CUSTOM_ALLOWED_WORDS.has(lowerWord)) return true;
  if (DICTIONARY_SET.has(lowerWord)) return true;

  // Stricter Inflection & Suffix Fallback (Removed loose -er rule to prevent 'aliver')
  const inflections = [
    { ending: "ed", strips: 2 },
    { ending: "ing", strips: 3 },
    { ending: "es", strips: 2 },
    { ending: "s", strips: 1 },
  ];

  for (const { ending, strips } of inflections) {
    if (lowerWord.endsWith(ending) && lowerWord.length - strips >= 2) {
      const stem = lowerWord.slice(0, -strips);

      if (
        CUSTOM_ALLOWED_WORDS.has(stem) ||
        CUSTOM_ALLOWED_WORDS.has(stem + "e") ||
        DICTIONARY_SET.has(stem) ||
        DICTIONARY_SET.has(stem + "e")
      ) {
        return true;
      }
    }
  }

  return false;
}
