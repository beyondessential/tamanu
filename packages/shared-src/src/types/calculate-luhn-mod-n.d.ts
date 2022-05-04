declare module 'calculate-luhn-mod-n' {
  export default function calculateLuhnModN(
    charToCodePoint: (char: string) => number,
    codePointToChar: (codePoint: number) => string,
    radix: number,
    input: string,
  ): string;
}
