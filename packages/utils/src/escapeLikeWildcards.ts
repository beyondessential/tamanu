const likeWildcards = /[\\%_]/g;

export const escapeLikeWildcards = (value: string): string => value.replace(likeWildcards, '\\$&');
