export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  license?: DictionaryLicense;
  sourceUrls?: string[];
};

export type DictionaryPhonetic = {
  text?: string;
  audio?: string;
  sourceUrl?: string;
  license?: DictionaryLicense;
};

export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
};

export type DictionaryDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

export type DictionaryLicense = {
  name: string;
  url: string;
};
