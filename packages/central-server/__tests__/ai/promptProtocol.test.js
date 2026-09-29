import { describe, expect, it } from 'vitest';

import ledger from '../../app/ai/promptProtocolLedger.json';
import { getPromptProtocolSurface } from './promptProtocolSurface';

// Deployments may override AI system prompts in settings, and an override keeps
// referring to the tags, markers and output fields that existed when it was
// written. The ledger records every one that has shipped, so a code change that
// drops one fails here instead of silently breaking those overrides.
const LEDGER_PATH = 'packages/central-server/app/ai/promptProtocolLedger.json';
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const surface = getPromptProtocolSurface();
const contextNames = [...new Set([...Object.keys(surface), ...Object.keys(ledger)])].sort();

const ledgerEntryFor = contextName => ledger[contextName] ?? { active: [], removed: [] };

describe('AI prompt protocol backward compatibility', () => {
  describe.each(contextNames)('%s', contextName => {
    const currentTokens = surface[contextName] ?? [];
    const { active, removed } = ledgerEntryFor(contextName);
    const removedTokens = removed.map(entry => entry.token);

    it('records every current token in the ledger', () => {
      const unrecorded = currentTokens.filter(token => !active.includes(token));
      expect(
        unrecorded,
        `These tokens are new, which is compatible with existing prompt overrides. ` +
          `Add them to "${contextName}.active" in ${LEDGER_PATH}.`,
      ).toEqual([]);
    });

    it('still emits every active ledger token', () => {
      const missing = active.filter(token => !currentTokens.includes(token));
      expect(
        missing,
        `These tokens are no longer emitted. Deployments that override the ` +
          `"${contextName}" prompt may rely on them, so this is a breaking change. ` +
          `Restore them, or move each to "${contextName}.removed" in ${LEDGER_PATH} ` +
          `with "removedIn" (the version it ships in) and a "reason".`,
      ).toEqual([]);
    });

    it('keeps active and removed tokens distinct', () => {
      const inBoth = active.filter(token => removedTokens.includes(token));
      expect(
        inBoth,
        `A token cannot be both active and removed. If it has been reinstated, ` +
          `delete its "${contextName}.removed" entry in ${LEDGER_PATH}.`,
      ).toEqual([]);
    });

    it('records a version and reason for every removal', () => {
      const incomplete = removed.filter(
        entry => !VERSION_PATTERN.test(entry.removedIn ?? '') || !entry.reason?.trim(),
      );
      expect(
        incomplete,
        `Each "${contextName}.removed" entry needs "removedIn" as x.y.z and a non-empty "reason".`,
      ).toEqual([]);
    });
  });
});
