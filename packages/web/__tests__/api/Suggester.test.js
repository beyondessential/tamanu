import { describe, expect, it, vi } from 'vitest';
import { Suggester } from '@tamanu/ui-components';

/**
 * A form usually builds one suggester per reference type and gives it to every field of that type —
 * the discharge form hands a single `practitioner` suggester to both "Discharging clinician" and
 * "Ordering prescriber". These cover the resulting requirement: concurrent lookups on one instance
 * must not see each other's responses.
 */
const buildApi = responses => ({
  get: vi.fn(async endpoint => {
    const response = responses[endpoint];
    if (!response) throw new Error(`No stubbed response for ${endpoint}`);
    return response();
  }),
});

const deferred = value => {
  let release;
  const promise = new Promise(resolve => {
    release = () => resolve(value);
  });
  return { promise, release: () => release() };
};

describe('Suggester', () => {
  it('resolves each current-option lookup to its own record', async () => {
    const api = buildApi({
      'suggestions/practitioner/clinician-a': async () => ({ id: 'clinician-a', name: 'Alice' }),
      'suggestions/practitioner/clinician-b': async () => ({ id: 'clinician-b', name: 'Bob' }),
    });
    const suggester = new Suggester(api, 'practitioner');

    const [first, second] = await Promise.all([
      suggester.fetchCurrentOption('clinician-a'),
      suggester.fetchCurrentOption('clinician-b'),
    ]);

    expect(first).toEqual({ label: 'Alice', value: 'clinician-a' });
    expect(second).toEqual({ label: 'Bob', value: 'clinician-b' });
  });

  // The regression: two fields sharing one suggester resolved their labels concurrently, and
  // whichever response landed last was handed to both — so one field displayed the other's value.
  it('does not leak a late-landing response into an earlier lookup', async () => {
    const alice = deferred({ id: 'clinician-a', name: 'Alice' });
    const bob = deferred({ id: 'clinician-b', name: 'Bob' });
    const api = buildApi({
      'suggestions/practitioner/clinician-a': () => alice.promise,
      'suggestions/practitioner/clinician-b': () => bob.promise,
    });
    const suggester = new Suggester(api, 'practitioner');

    const alicePending = suggester.fetchCurrentOption('clinician-a');
    const bobPending = suggester.fetchCurrentOption('clinician-b');

    // Bob's request was made second but resolves first, so it is the most recent response when
    // Alice's lookup finally settles.
    bob.release();
    await bobPending;
    alice.release();

    expect(await alicePending).toEqual({ label: 'Alice', value: 'clinician-a' });
    expect(await bobPending).toEqual({ label: 'Bob', value: 'clinician-b' });
  });

  it('keeps a suggestions list separate from a concurrent current-option lookup', async () => {
    const list = deferred([
      { id: 'clinician-a', name: 'Alice' },
      { id: 'clinician-b', name: 'Bob' },
    ]);
    const single = deferred({ id: 'clinician-b', name: 'Bob' });
    const api = buildApi({
      'suggestions/practitioner': () => list.promise,
      'suggestions/practitioner/clinician-b': () => single.promise,
    });
    const suggester = new Suggester(api, 'practitioner');

    const listPending = suggester.fetchSuggestions('');
    const optionPending = suggester.fetchCurrentOption('clinician-b');

    single.release();
    await optionPending;
    list.release();

    // A single record leaking into the list call would previously have made the formatter run over
    // the wrong shape entirely.
    expect(await listPending).toEqual([
      { label: 'Alice', value: 'clinician-a' },
      { label: 'Bob', value: 'clinician-b' },
    ]);
    expect(await optionPending).toEqual({ label: 'Bob', value: 'clinician-b' });
  });
});
