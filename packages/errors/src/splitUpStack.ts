export function splitUpStack(stack: string): string[] {
  return stack
    ?.split('\n')
    .slice(1)
    .map(line => line.trim().replace(/^at /, ''));
}
