/** 日替わりの「今日の発見」用シード（同日は同じ並び） */
export function getDailySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export function pickDailyRandom<T>(items: T[], count: number, seed: number) {
  if (items.length === 0 || count <= 0) return [];
  const shuffled = [...items];
  let state = seed;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const index = state % (i + 1);
    [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function pickDailyCurated<T extends { category_slug?: string | null }>(items: T[], count: number, seed: number) {
  const shuffled = pickDailyRandom(items, items.length, seed);
  const selected: T[] = [];
  const seenCategories = new Set<string>();

  for (const item of shuffled) {
    const category = item.category_slug ?? `uncategorized-${selected.length}`;
    if (!seenCategories.has(category)) {
      seenCategories.add(category);
      selected.push(item);
    }
    if (selected.length >= count) return selected;
  }

  return selected.concat(shuffled.filter((item) => !selected.includes(item))).slice(0, count);
}
