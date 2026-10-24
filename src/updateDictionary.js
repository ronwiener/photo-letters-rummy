// updateDictionary.js
import fs from "fs";

// 1. Read your existing JSON dictionary file with the correct path
const filePath = "./src/constants/words_dictionary.json";
const rawData = fs.readFileSync(filePath, "utf-8");
const wordsArray = JSON.parse(rawData);

const wordSet = new Set(wordsArray.map((w) => w.toUpperCase().trim()));

// 2. Helper function to apply basic English pluralization rules
function getPlural(word) {
  // Skip words that are already very short or symbols
  if (word.length <= 1) return null;

  // Consonant + 'y' -> 'ies' (e.g., CITY -> CITIES)
  if (
    word.endsWith("Y") &&
    !["A", "E", "I", "O", "U"].includes(word[word.length - 2])
  ) {
    return word.slice(0, -1) + "IES";
  }
  // Ends with s, x, z, ch, sh -> 'es' (e.g., BOX -> BOXES)
  else if (
    word.endsWith("S") ||
    word.endsWith("X") ||
    word.endsWith("Z") ||
    word.endsWith("CH") ||
    word.endsWith("SH")
  ) {
    return word + "ES";
  }
  // Default -> add 's' (e.g., CAT -> CATS)
  else if (!word.endsWith("S")) {
    return word + "S";
  }

  return null;
}

// 3. Generate and add plurals
let addedCount = 0;
wordSet.forEach((word) => {
  const plural = getPlural(word);
  if (plural && !wordSet.has(plural)) {
    wordSet.add(plural);
    addedCount++;
  }
});

// 4. Sort alphabetically and convert back to array
const sortedWords = Array.from(wordSet).sort();

// 5. Save back to the JSON file
fs.writeFileSync(filePath, JSON.stringify(sortedWords, null, 2), "utf-8");

console.log(
  `✅ Success! Added ${addedCount} pluralized words. Total dictionary size: ${sortedWords.length}`,
);
