# Working with a Tamanu deployment through its API

How an agent reads from and writes to a running Tamanu deployment: connecting, the request helper, where things live, and the behaviours that catch people out. The `seed-demo-data` and `transfer-deployment-data` skills both rely on this.

## Use the API, from a shell

Tamanu's web app is a JavaScript single-page app. Fetching its pages returns an empty shell titled "Tamanu", so **don't use the web app or a browser**. Do everything through the HTTP API with `GET`, `POST` and `PUT` requests carrying a bearer token.

That needs a shell that can run `node` or `curl`, such as Claude Code on the user's machine, or a Workhorse card checked out to a paired device. If all you have is a tool that reads web pages, stop and say so straight away: the task can't be done from there, and the user should run it where you have a shell.

## Before writing anything

- **Confirm the deployment you'll write to.** Only ever write to a demo, presentation, PR (`*.cd.tamanu.app`) or test deployment. If it looks like a real facility's production deployment, stop and ask.
- **Ask for credentials; don't guess them, and don't write them into files or commits.** PR deployments use `admin@tamanu.io` / `admin`. Presentation and demo deployments have their own admin password, which the user provides. Keep passwords in environment variables for the session.
- **Make every step safe to re-run.** Look things up before creating them, reuse what's already there, and report what you skipped.

## Addresses

Each deployment has a central server and one or more facility servers, each with its API under `/api`:

| | PR deployments | Demo deployments |
|---|---|---|
| Central | `https://central.<name>.cd.tamanu.app/api` | `https://central.<name>.demos.tamanu.app/api` |
| Facility | `https://facility-1.<name>.cd.tamanu.app/api` | `https://facility-1.<name>.demos.tamanu.app/api` |

For example, the presentation demo is `https://central.presentation.demos.tamanu.app/api` and `https://facility-1.presentation.demos.tamanu.app/api`. Check central responds with `GET /api/public/ping`, which returns `{ ok: true }`. A `GET` on the bare `/api/` returning 400 is normal.

## Logging in

- **Log in to each server separately** with `POST /api/login` and `{ email, password, deviceId }`. Pick any stable `deviceId`, e.g. `"demo-setup"`. The response has a `token`, the server's `primaryTimeZone`, and, on a facility server, the `availableFacilities`. Send the token as `Authorization: Bearer <token>`.
- **Scope facility requests to a facility.** After logging in to a facility server, call `POST /api/setFacility` with `{ facilityId }` and use the token it returns. Without it, facility-scoped endpoints fail or return nothing.

## What lives where

- **Central** (`/api/admin/...`): settings, spreadsheet imports and exports, users and roles, reference data.
- **Facility**: clinical records (patients, appointments, location bookings, allergies, conditions), created as staff would create them.
- **They meet on the next sync.** Something created on central (reference data, users, settings, imported records) reaches a facility server a minute or two later, and the reverse. Poll for it before relying on it on the other side.

## The request helper

Write the work as one Node script in a temporary directory outside the repository. Node 18 or later has `fetch`, `FormData` and `Blob` built in, so nothing needs installing; don't rely on `jq`.

```js
const login = async (base, email, password) => {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId: 'demo-setup' }),
  });
  if (!res.ok) throw new Error(`login ${base} -> ${res.status} ${await res.text()}`);
  return res.json(); // { token, primaryTimeZone, availableFacilities?, ... }
};

const api = async (base, token, method, path, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
};

// Lists come back as { count, data } or as a bare array
const rows = result => (Array.isArray(result) ? result : (result?.data ?? []));
```

## Finding IDs

Look every ID up from the deployment you're writing to; never guess. Useful lookups on a facility server:

- **Clinicians:** `/api/suggestions/practitioner?q=&noLimit=true`
- **Areas (location groups):** `/api/suggestions/facilityLocationGroup/all?facilityId=<id>`
- **Reference data:** `/api/suggestions/<type>/all`, or `/api/suggestions/<type>?q=<text>` to search, e.g. `allergy`, `reaction`, `diagnosis`, `appointmentType`, `bookingType`, `procedureType`
- **Patients:** `/api/patient?firstName=&lastName=&facilityId=<id>&isAllPatientsListing=true`
- **Appointments:** `/api/appointments?after=<yyyy-MM-dd HH:mm:ss>&before=<...>&all=true`, optionally with `patientId`

On central:

- **Reference data:** `/api/admin/referenceData/manage?referenceDataType=<type>&rowsPerPage=200`
- **Programs:** `/api/admin/programs`, then `/api/admin/program/<id>/surveys`
- **Users:** `/api/admin/users?rowsPerPage=200`

## Settings

`GET /api/admin/settings?scope=global` (or `scope=central`, or `scope=facility&facilityId=<id>`) returns a scope's settings. `PUT /api/admin/settings` with `{ settings, scope, facilityId? }` **saves the object you send as the entire scope**, so always `GET` it, change only the keys you mean to, and `PUT` all of it back. Secrets come back masked, and sending the mask back leaves them unchanged. Changing high-risk settings needs an admin.

## Things that catch people out

- **Patient search needs `isAllPatientsListing=true`.** Without it, the patient list only covers patients with an open encounter, so a check for an existing patient finds nothing and you create duplicates.
- **`POST /api/patient` doesn't generate a patient ID.** The web app does, so you must too: four capital letters then six digits, e.g. `KLMN739204`.
- **Phone numbers in `POST /api/patient` are coerced to numbers**, which drops a leading zero. Leave them out, or set them afterwards.
- **`POST /api/admin/users` with `allowedFacilityIds` can fail** with a database error ("ON CONFLICT does not support deferrable unique constraints"). Leave it out.
- **Dates and times:** datetimes are ISO 9075 (`yyyy-MM-dd HH:mm:ss`) in the server's primary time zone, given at login. Dates of birth and other date-only values are plain `yyyy-MM-dd`. Work out "today" in the primary time zone, not the machine's.
- **Appointments with an `email` send the patient a real reminder.** Leave it out.
- **Overlapping location bookings are refused** (`POST /api/appointments/locationBooking` checks the location). Skip them rather than overwrite.
- **Portal emails need `patientPortal.baseUrl`.** Portal registration and form emails fail until the global setting `patientPortal.baseUrl` is the deployment's portal address.
