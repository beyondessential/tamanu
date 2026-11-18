---
id: LPUB
---

# Public lab result lookup

Applies to the lookup that returns a lab request's results by its display ID without signing in, and to the settings that govern which requests it answers for and how often it can be used.

## What the lookup returns

- A lookup is made with a lab request display ID and returns every lab request carrying that ID whose test category is listed in the lookup's category whitelist.
- No categories are listed by default, so until a deployment lists some, every lookup returns nothing.
- For each request it returns, the lookup gives the date the request was raised and the patient's initials.
- Results are given only once a request is published, and only for tests whose test type is listed in the lookup's test type whitelist. No test types are listed by default.
- Each result is given as its value alone.
- A browser page on another site can make the lookup only when the deployment names that site as the allowed origin for the server's public routes.

> [!NOTE]
> Display IDs are printed on sample labels and paperwork, so holding one does not show that the holder is the patient. The lookup answers for nothing until a deployment chooses which categories to expose.

## Limits on lookups

- Lookups are limited per client address within a time window. The window and the number of lookups allowed in it are settings.
- Every lookup counts towards the limit, whether or not it found a request.
- A lookup over the limit is refused until the window allows more.
