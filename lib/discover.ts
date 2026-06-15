/** 日替わりの「今日の発見」用シード（同日は同じ並び） */
export function getDailySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export function pickDailyRandom<T>(items: T[], count: number, seed: number) {
  if (items.length <= count) return [...items];
  const picked: T[] = [];
  const used = new Set<number>();
  let state = seed;

  while (picked.length < count && used.size < items.length) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const index = state % items.length;
    if (!used.has(index)) {
      used.add(index);
      picked.push(items[index]);
    }
  }
  return picked;
}