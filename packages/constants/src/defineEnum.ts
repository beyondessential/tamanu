/* eslint-disable no-unused-vars */
import type { Simplify } from 'type-fest';
import type { SplitIncludingDelimiters, StringArrayToDelimiterCase } from 'type-fest/source/delimiter-case';
import type { StringDigit, UpperCaseCharacters, WordSeparators } from 'type-fest/source/internal';

import { constantCase, startCase  } from 'es-toolkit';
type RemoveDuplicatedCharacters<TValue, TChar extends string> = TValue extends `${infer T}${TChar}${TChar}${infer U}`
  ? RemoveDuplicatedCharacters<`${T}${TChar}${U}`, TChar>
  : TValue;
type SpecialChars =  | '!'  | '#'  | '$'  | '%'  | '&'  | ' '  | '('  | ')'  | '*'  | '+'  | ','  | '-'  | '-'  | '.'  | '.'  | '/'  | ':'  | ';'  | '<'  | '='  | '>'  | '?'  | '@'  | '['  | '\\'  | ']'  | '^'  | '_'  | '_'  | '`'  | '{'  | '|'  | '}'  | '~';
type DelimiterCase<Value, Delimiter extends string> = string extends Value
  ? Value
  : Value extends string
    ? RemoveDuplicatedCharacters<
        StringArrayToDelimiterCase<
          SplitIncludingDelimiters<Value, SpecialChars | StringDigit | UpperCaseCharacters | WordSeparators>,
          true,
          SpecialChars | WordSeparators,
          StringDigit | UpperCaseCharacters,
          Delimiter
        >,
        Delimiter
      >
    : Value;
type EsToolkitSnakeCase<TValue> = DelimiterCase<TValue, '_'>;

type ToValues<T> = T extends readonly [string, string][] ?
  {
    [K in keyof T]: T[K] extends readonly [infer K] ? K : never
  }
:T extends readonly string[] ? T
:never



type ToLabel<T> = T extends readonly [string, string][] ? Simplify<{
  [K in T[number][0]]: Extract<T[number], [K, string]>[1]
}>: T extends readonly string[] ?
Simplify<{
  [K in T[number]]: string
}>
: never;
type ToEnum<T> = T extends readonly [string, string][] ? Simplify<{
  [K in T[number][0] as Uppercase<EsToolkitSnakeCase<K>>]: Extract<T[number], [K, string]>[0]
}> :
T extends readonly string[] ? Simplify<{
  [K in T[number] as Uppercase<EsToolkitSnakeCase<K>>]: K
}>
:never

export const defineEnum = <X extends string, U extends [value: X, label: string] | string, T extends Readonly<[U, ...U[]]>>(arr: T) => {
  const filtered = arr.filter(Boolean);
  const values = filtered.map((el) => typeof el === 'string' ? el : el[0]) as unknown as ToValues<T>
  const enumEntries = filtered.map((el) => {
    return typeof el === 'string' ? [constantCase(el), el] : [constantCase(el[0]), el[0]];
  });
  const labelEntries = filtered.map((el) => {
    return typeof el === 'string' ? [el, startCase(el)] : [el[0], el[1]];
  })

  return { enum: Object.fromEntries(enumEntries) as ToEnum<T>, label: Object.fromEntries(labelEntries) as ToLabel<T>, values };
};
