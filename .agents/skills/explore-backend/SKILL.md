---
name: explore-backend
description: "Explore this card's server side directly, in passes, until a full pass finds nothing above low"
label: "Explore the backend"
category: verify
workhorse-version: 0.8.0
---

## Your task: explore the backend

Code review reads the server side, and walkthroughs reach it through the UI. Neither drives it directly with the inputs and timing that break it. Explore every entry point the card's work touches, directly and in passes, until a full pass finds nothing above low.

`build-loop` runs this as its backend rounds; run on its own, it explores the card's branch as it stands. Find the card's base and diff against it as `.agents/docs/bases-and-dependencies.md` says, to learn which entry points the work touches. `.agents/docs/running-loops.md` "Finding, fixing and re-checking" governs how a finding is fixed and checked, and `.agents/docs/browser-rig.md` how to get a running copy of the app.

### Entry points

An entry point is anywhere the outside world reaches the server side: an HTTP route, an RPC or GraphQL handler, a form post or a framework's server action, a webhook, a queue consumer, a scheduled job, a command-line command. List the ones the work touches in the plan before the first pass, with who may call each.

### The seed

Explore on data shaped to break things, not only on happy data. Keep an edge-case seed in the rig recipe's `seed` entry point, so every lease starts from it:

- names that differ only by case or collide after normalising;
- unicode and maximum-length names;
- the largest counts the product allows;
- records shared between owners, and records owned by someone else;
- deleted, moved and archived records;
- rows shaped by the previous release;
- one user at every access level.

Ask for a rig with `workhorse-local rig lease` and release it before you report. `workhorse-local rig reset <lease>` returns a lease to the seed mid-run.

### Two harnesses

- **Over the wire:** call each entry point the way a real client does, against a production build, with a session for each kind of user. Where the framework reaches server-side code through a request the client sends rather than a route you can name, record that request and replay it.
- **Functions:** call the plain functions behind the entry points from a small script against the lease's database (`RIG_DATABASE_URL`). This is quicker for a matrix, and reaches code the client never calls with odd arguments.

### What to try, per entry point

- **Access:** each role the product has, a user whose access was revoked, an authorisation check that cannot be answered, a signed-out caller, and an id belonging to another owner or tenant. A refusal says nothing about a thing the caller cannot see.
- **Input:** empty values, the maximum and one past it, malformed and oversized payloads, unicode, case variants, `../` and encoded slashes in anything that becomes a path or a URL, and a value valid for another tenant.
- **Concurrency:** the same write sent twice at once; conflicting writes raced, such as set and unset, add and remove, or change and delete; a retry after a lost response. Afterwards the data is consistent and every caller had a definite answer.
- **Failure:** an external service stopped, slowed, or answering server errors and refusals; a partial write; a restart mid-operation.
- **State:** the operation run against rows from the previous release, against a record mid-transition, at the largest counts, and any migration the work adds run on the edge-case seed.

### Each pass

1. **Explore** every entry point on the list with the harnesses and the matrix above.
2. **File each substantive finding** with `file_issue`, its severity and a reproduction, as `.agents/docs/card-issues.md` says.
3. **Turn it into a test first.** Write the reproduction as a failing unit or integration test at the lowest level that catches it, then fix. Probes are throwaway; the test is what keeps the finding fixed. Make a probe that reached a path no test reached a permanent test too, even where it found nothing.
4. **Fix** with the decisions settled, one commit per issue, and have a different agent re-check the fix.
5. **Explore again,** around what the fixes touched as well as the rest.

### Stopping

Stop when a full pass over every entry point finds nothing above low, and every finding from earlier passes has a test that failed before its fix. Then summarise in your reply what each pass covered and found, and say the findings are in the card's issues.

If the work outlasts this turn, hold the pull request while you do it (see `.agents/docs/pull-requests.md`).
