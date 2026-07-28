/**
 * Discovery — candidate generation.
 *
 * Discovery only has to be *broad*; trust (the pinned cert + SAN check) does the
 * filtering, so it is safe to try every candidate promiscuously. In the full
 * design the sources are: last-known-good cache, mDNS/DNS-SD, custom UDP
 * multicast, the Canopy candidate list, and user entry (typed / QR). There is
 * deliberately NO active subnet scanning.
 *
 * This prototype implements only the explicit / user-entry source; the others
 * slot in behind the same async-iterable interface. A candidate is just
 * `{ address, port, source }`.
 */
export async function* candidates({ explicit = [] } = {}) {
  for (const c of explicit) {
    // `source` is authoritative metadata — set it last so a caller-provided
    // field can't override it.
    yield { ...c, source: 'user-entry' };
  }
  // Future sources (each an async generator merged into this stream):
  //   yield* fromCache(...)
  //   yield* fromMdns(...)
  //   yield* fromMulticast(...)
  //   yield* fromCanopy(...)
}
