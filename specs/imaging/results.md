---
id: IMGR
---

# Imaging results

Applies to recording a result on an imaging request: who completed it, when it was completed, and its description.

## Recording a result

- A result records who completed it (Completed by), when it was completed (Completed), and a result description.
- A result can be entered only while the request's status is Completed.
- Completed defaults to the current date and time.
- When the user changes the request's status to Completed, Completed by defaults to the logged-in user, unless a clinician is already chosen. The user can change it before saving.
- A request that is already Completed opens with Completed by empty, ready for an additional result.

> [!NOTE]
> Completed by is defaulted on the change of status rather than whenever the request is opened, because a chosen clinician is what makes a save record a result. Defaulting it on opening would add a result in the name of whoever next saves a completed request, even to change only its facility area.
