const PALETTES = [
  ["#315c68", "#526348"],
  ["#b95032", "#172026"],
  ["#526348", "#315c68"],
  ["#172026", "#b95032"],
  ["#4a6741", "#2c4a52"],
  ["#8b5a3c", "#315c68"]
] as const;

export function shopAccentFromSlug(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];
  return {
    from: palette[0],
    to: palette[1],
    gradient: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`
  };
}