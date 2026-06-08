const MAX_HISTORY_ITEMS = 20;

export function updateSearchHistory(history: string[], word: string): string[] {
  const displayWord = word.trim();
  const normalizedWord = displayWord.toLowerCase();

  if (!normalizedWord) {
    return history;
  }

  const withoutDuplicate = history.filter(
    (item) => item.trim().toLowerCase() !== normalizedWord,
  );

  return [displayWord, ...withoutDuplicate].slice(0, MAX_HISTORY_ITEMS);
}
