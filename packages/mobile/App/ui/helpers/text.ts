export const setDotsOnMaxLength = (text: string, maxlength: number): string => (text.length > 20 ? `${text.substring(0, maxlength - 3)}...` : text);
