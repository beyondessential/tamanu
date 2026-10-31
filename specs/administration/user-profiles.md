---
id: USRPRF
---

# User profiles

Administrators manage the people who use Tamanu through the User profiles view in the admin panel. The view lists users in a table with a search above it, showing each user's role, designations and the facilities they can log in to, so an administrator can see who holds which role and designation at a given facility. From the list, administrators add users, edit their profiles and passwords, and schedule their leave.

## The user list

- [ ] The view requires permission to list users (`list` on `User`). Without it, the view says that permission is required
- [ ] The list holds people only. The system user, the built-in admin account and machine accounts such as sync users are left out
- [ ] Each row shows whether the user is active or deactivated, then their display name, ID, role, designations, facilities, email and phone number. A missing value shows as a dash
- [ ] The list is sorted by display name by default, and can also be sorted by role, designation, email or phone number
- [ ] Designations show on one line, cut short when they do not fit, with the full list shown on hover
- [ ] Selecting a row opens that user's profile

## Search

- [ ] The search covers display name, ID, role and email. Display name, ID and email match any part of the value, ignoring case, and the role is chosen from a list
- [ ] Advanced search adds a designation filter, a facility filter, and an option to include deactivated users, which is on by default
- [ ] Filters combine, so a user is listed only when they match every filter set
- [ ] The result count and the pages reflect the filters, so every page but the last is full

## Facility access

A user's facility access is the set of facilities login allows them into. The user list shows and searches it by the same rules login applies, so what an administrator sees here matches what the user meets at login. How sensitive networks bound that access is set out in `sync/sensitive-networks.md`.

- [ ] A superuser, a user with the admin role, can log in to every facility
- [ ] A user can log in to each facility linked to their profile as an allowed facility
- [ ] A user may access all non-sensitive facilities when facility restriction (`auth.restrictUsersToFacilities`) is off, or when their role holds the facility login permission (`login` on `Facility`)
- [ ] A facility login permission that names a single facility still grants all non-sensitive facilities, as it does at login
- [ ] A deactivated user cannot log in at all. The list shows the facility access they would have if reactivated, alongside their deactivated status

## Facility column

- [ ] The Facility column shows "All facilities" for a user who can log in to every facility: a superuser, or a user who may access all non-sensitive facilities when no facility belongs to a sensitive network
- [ ] For any other user, the column lists the names of the facilities they can log in to, in alphabetical order
- [ ] The list shows on one line, cut short when it does not fit, with the full list shown on hover, as designations are
- [ ] A user with no facility access shows a dash

## Facility filter

- [ ] The facility filter sits in advanced search beside the designation filter, and takes a single facility chosen from the active facilities as the administrator types
- [ ] The filter lists the users who can log in to the chosen facility: superusers, users linked to it, and, when the facility is outside every sensitive network, users who may access all non-sensitive facilities
- [ ] A user is listed under a facility filter exactly when their Facility column shows that facility or "All facilities"
- [ ] With facility restriction off, filtering by a facility outside every sensitive network lists every user the other filters allow, since each of them can log in there. The filter narrows the list when facility restriction is on, or for a facility in a sensitive network

## Adding a user

- [ ] Administrators with permission to create users (`create` on `User`) can add a user from the view
- [ ] A new user needs a display name, role, email and password, with the password entered twice to confirm it. ID, phone number, designations and allowed facilities are optional
- [ ] Email must be unique across all users, and display name must be unique ignoring case. A clash is shown against its field, and nothing is saved
- [ ] Role, designations and allowed facilities are chosen from lists. Designations and facilities must be active, and every facility can be selected at once
- [ ] A password that looks like a stored password hash is refused
- [ ] Once the user is created, a confirmation is shown and the list refreshes to include them

## Editing a profile

- [ ] A profile shows the user's status, display name, ID, role, designations, email, phone number and allowed facilities
- [ ] Editing a profile requires permission to write all users (`write` on `User`). The permission every user holds over their own record does not count, so without the wider permission the profile is read only and can only be closed
- [ ] Status is Active or Deactivated
- [ ] Changes can be confirmed once something on the profile has changed
- [ ] The uniqueness rules for email and display name apply when either is changed
- [ ] Saving replaces the user's designations and allowed facilities with those chosen
- [ ] When administrators change their own role to one without permission to write all users, a warning explains that another authorised user will be needed to change it back, and the change is saved only if they continue
- [ ] Administrators who can edit the profile can set a new password, entered twice to confirm it, under the same hash rule as a new user's. Leaving both fields empty keeps the current password

## Scheduled leave

- [ ] A profile lists the user's upcoming leave: each period that has not yet ended, with its start and end dates
- [ ] Administrators who can edit the profile schedule leave by choosing a start and end date, and can remove upcoming leave after confirming
- [ ] The end date cannot be before the start date or before today, and a user's leave periods cannot overlap
- [ ] Scheduling leave removes the user from any locations assigned to them on those dates. When there are such assignments, a warning says so first, and the leave is scheduled only if the administrator confirms
