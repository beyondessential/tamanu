export const fuzzySearch = (query, target) => {
  // All targets have equal relevance if there is no query
  if (!query) return 1;
  // Sanitize and create fuzzy search regex from query
  const match = target.match(new RegExp(`^${query.replace(/./g, '[\\$&].*')}`, 'i'));
  if (!match) return null;
  // Calculate relevance based on the position of the match
  return (
    query
      .toLowerCase()
      .split('')
      .reduce(
        (total, char, index) =>
          total + (match.index + index === target.indexOf(char, match.index + index) ? 2 : 1),
        0,
      ) / query.length
  );
};
