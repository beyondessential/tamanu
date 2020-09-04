export const setDotsOnMaxLength = (text: string, maxlength: number): string => {
  return text.length > 20 ? `${text.substring(0, maxlength - 3)}...` : text;
};
