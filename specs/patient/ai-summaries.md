---
id: AISUM
---

# AI summaries

Applies to the records an AI patient summary and an AI encounter summary draw on.

## Sensitive records

- A summary draws only on records that anyone permitted to read the summary may also read, whoever generates it.
- A lab request holding a test of a sensitive test type stays out of a summary entirely, including its other tests, its category and its results interpretation.
- A prescription of a sensitive drug stays out of a summary, whether it was prescribed in an encounter or is one of the patient's ongoing medications.
- A patient summary also leaves out everything recorded against an encounter at a facility in a sensitive network, as described under [AI patient summaries](../sync/sensitive-networks.md#ai-patient-summaries) in the sensitive networks spec.

> [!NOTE]
> A summary is stored once and shown to every reader. Tailoring it to the permissions of whoever generated it would let one user's access decide what everyone else sees.
