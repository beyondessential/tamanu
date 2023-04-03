export const subStrSearch = (query, target) => {
  const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${sanitizedQuery}`, 'i');
  return regex.test(target);
};
