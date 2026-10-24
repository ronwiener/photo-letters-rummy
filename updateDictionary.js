import fs from "fs";

const filePath = "./src/constants/words_dictionary.json"; 
console.log("Reading dictionary file...");
const rawData = fs.readFileSync(filePath, "utf-8");
const wordsArray = JSON.parse(rawData);

console.log(`Loaded ${wordsArray.length} words. Building word set...`);
const wordSet = new Set(wordsArray.map((w) => w.toUpperCase().trim()));

function getPlural(word) {
  if (word.length <= 1) return null;

  if (
    word.endsWith("Y") &&
    !["A", "E", "I", "O", "U"].includes(word[word.length - 2])
  ) {
    return word.slice(0, -1) + "IES";
  } else if (
    word.endsWith("S") || 
    word.endsWith("X") || 
    word.endsWith("Z") || 
    word.endsWith("CH") || 
    word.endsWith("SH")
  ) {
    return word + "ES";
  } else if (!word.endsWith("S")) {
    return word + "S";
  }

  return null;
}

console.log("Generating plurals...");
const newPlurals = [];
for (const word of wordSet) {
  const plural = getPlural(word);
  if (plural && !wordSet.has(plural)) {
    newPlurals.push(plural);
  }
}

for (const p of newPlurals) {
  wordSet.add(p);
}

const addedCount = newPlurals.length;
console.log(`Sorting ${wordSet.size} total words alphabetically...`);
const sortedWords = Array.from(wordSet).sort();

console.log("Saving back to dictionary file...");
fs.writeFileSync(filePath, JSON.stringify(sortedWords, null, 2), "utf-8");

console.log(
  `✅ Success! Added ${addedCount} pluralized words. Total dictionary size: ${sortedWords.length}`,
);
