# Fact sheets: brief

Each fact sheet boils one or more ledgers (`../ledger/`) down to the facts the sync overview will be written from. The ledgers already checked every claim against the code at `22d3edaa36`; a fact sheet does not redo that, it selects and organises.

## Rules

- Read-only on everything except your own fact sheet. No git commands that change state, no servers, no tests.
- Use only what the ledgers established: entries with verdict `confirmed`, or the corrected version of `partly`, `wrong` and `outdated` entries. Where a ledger marks something `inference` or `unverifiable`, carry that label. Where two ledgers disagree or a ledger is unclear, read the code and say which is right.
- Cite the ledger entry in brackets after each fact, for example `[SES-20]`.
- Point into the code by file and function name (for example `persistIncomingChanges` in `packages/central-server/app/sync/CentralSyncManager.js`). No line numbers.
- Facts, not narrative. Numbered sequences for things that happen in order, tables for sets of things that share a shape, short bullets otherwise. No introduction, no summary, no advice.
- Keep the reason for something when the ledger found one (a code comment, a PR), in a few words, marked as such. The why is the most valuable part.
- This repository is public: no deployment, country, site or hospital names. Refer to PRs by number, not people.
- Australian/NZ English. No em-dashes.
- Stay within the line limit given in your task. If you must cut, cut detail before cutting whole topics.

## What to send back

At most 80 words: that the file is written, anything the ledgers left contradictory or unclear, and anything you had to check in the code.
