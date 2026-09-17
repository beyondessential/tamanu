---
id: LREJ
---

# Rejected lab requests

A lab request is rejected when the laboratory cancels its sample. Rejection is a terminal state reached only through the laboratory integration: the request can no longer progress, and the requesting clinician is notified so they can review the rejection report and re-request if needed.

## Becoming rejected

- [ ] A lab request becomes rejected when the connected laboratory system cancels the corresponding sample, received as a cancelled diagnostic report over the FHIR integration.
- [ ] Rejected is a terminal status reached only through the laboratory integration; it is not offered as a manual status choice.
- [ ] A rejected request displays the "Rejected" status.

## Status cannot change

- [ ] A rejected request's status cannot be updated: the change-status action is unavailable for a rejected request.

## Appearing in the finalised listing

- [ ] Rejected requests appear in the finalised lab requests listing alongside other finalised requests.
- [ ] The finalised lab requests listing has a status filter offering Published, Invalidated, and Rejected, and can narrow the listing to one or more of these.
- [ ] With no status filter applied, the finalised listing shows all its requests, including rejected ones.

## Rejection report

- [ ] On a rejected request, the printout action is labelled "Rejection report".
- [ ] The Rejection report action opens the standard lab request printout; only the label differs.

## Notification

- [ ] When a lab request becomes rejected, the requesting clinician receives a dashboard notification reading "Lab sample for [patient name] ([patient identifier]) has been rejected".
- [ ] Selecting the notification opens the rejected request's lab request view, where the rejection report can be viewed.
