The users, designations and roles a Tamanu deployment needs, and the permissions matrix that grants
each role what it can do. Users and designations are configured through the reference data import
spreadsheet, and roles and permissions through the permissions matrix spreadsheet, both downloaded from
and uploaded to the admin panel. Each can also be managed one record at a time on the **Users** screens
of the admin panel.

For the settings that control facility access and which permissions apply see
[Settings](02-settings.md), and for what each permission grants see [Permissions](03-permissions.md).

---

# Reference Data Types

See the [Tamanu Reference Data Manual](https://beyond-essential.slab.com/public/posts/tamanu-reference-data-manual-intf5xei) for how importing works.

Set up in this order, since each type refers to the ones before it:

1. Roles, on the `Role` tab of the permissions matrix
2. Designations
3. Facilities, covered in the [Deploying Tamanu](../01-deploying-tamanu/) configuration guides
4. Users
5. Permissions, on the `Permission` tab of the permissions matrix

## Role

A role groups users who do the same kind of work, such as `Doctor`, `Nurse` or `Admin`. Each user has
one role, and the permissions matrix grants permissions to roles rather than to individual users.

| Field | Value |
| --- | --- |
| Tab name | `Role` |

Where * is a required field.

| Column name | Description |
| --- | --- |
| id * | Unique id for the role. Letters, numbers and hyphens only. This id is the column header for the role on the `Permission` tab and the value of a user's `role` column. |
| name * | Name for the role, displayed when choosing a user's role. |

The `Role` and `Permission` tabs are imported together on the **Import** tab of the **Permissions**
screen in the admin panel, not the **Reference data** screen. The `Role` tab is read first, so a
role can be added and given permissions in a single import.

### Managing roles in the admin panel (supported from v2.53 onwards)

Roles can also be added and deleted on the **Roles** tab of **Users** > **Roles & designations**:

- Select **Add role** and enter an **ID** and **Name**. The id must not already be in use
- Select **Delete** against a role to remove it. A role cannot be deleted while any user is assigned
  to it: the screen lists those users, and each needs a different role first

**[Screenshot: the Roles tab of Roles & designations, listing roles with Add role and Delete]**

A role's name cannot be changed on this screen. Change it on the `Role` tab and re-import.

---

## Designation

A designation describes a user's job, such as `Nurse`, `Senior Nurse` or `Midwife`, independently of
the role that sets their permissions. Tasks are assigned to designations, so the designation decides
whose task list a task appears in. See the [Tasks](../14-tasks/) configuration guides. A user can hold
several designations, or none.

| Field | Value |
| --- | --- |
| Tab name | `Designation` |

Where * is a required field.

| Column name | Description |
| --- | --- |
| id * | Unique id for the designation, for example `designation-Nurse`. Letters, numbers and hyphens only. This id is the value used in a user's `designations` column. |
| code * | Code for the designation. Letters, numbers, hyphens, full stops and forward slashes only. |
| name * | Name for the designation, displayed on user profiles and tasks. |
| visibilityStatus | `current` for designations in use, or `historical` for designations that should no longer be assigned. Defaults to `current` if blank. Only `current` designations can be assigned to a user. |
| availableFacilities | Accepted on every reference data type, but has no effect on designations. Leave blank. |

### Managing designations in the admin panel (supported from v2.53 onwards)

Designations can also be added and deleted on the **Designations** tab of **Users** >
**Roles & designations**:

- Select **Add designation** and enter an **ID**, **Code** and **Name**
- Select **Delete** against a designation to remove it. A designation cannot be deleted while any
  user or task is assigned to it: the screen lists them, and each needs updating first

**[Screenshot: the Designations tab of Roles & designations, listing designations with Add designation and Delete]**

Designations are reference data, so they can also be edited on the **Manage** tab of the
**Reference data** screen (supported from v2.54 onwards).

---

## User

A user is an account a person logs in to Tamanu with. Their name is recorded against everything they
do, and appears wherever staff choose a clinician.

| Field | Value |
| --- | --- |
| Tab name | `User` |

Where * is a required field.

| Column name | Description |
| --- | --- |
| id * | Unique id for the user, for example `user-jsmith`. Letters, numbers and hyphens only. Cannot be changed once the user exists. |
| displayId | A registration or staff number for the user, such as a medical council number. Printed on prescriptions. Leave blank if not required. |
| email * | The email the user logs in with. Must be unique across all users. Not case sensitive when logging in. |
| displayName * | The user's name as displayed throughout Tamanu. The importer does not check that it is unique, but the **User profiles** screen does, so keep display names distinct. |
| role | The `id` of the user's role, from the `Role` tab. Defaults to `practitioner` if blank. This column is not validated on import, so a role id that does not exist is accepted and the user is granted no permissions. |
| phoneNumber | The user's phone number. Any format is accepted. Leave blank if not required. |
| deviceRegistrationQuota (supported from v2.41 onwards) | The number of new mobile devices the user may register. Defaults to `0`, so no devices, for a new user. See the [Deploying Tamanu](../01-deploying-tamanu/) configuration guides. |
| visibilityStatus | `current` for active users, or `historical` to deactivate the user. Defaults to `current` if blank. A deactivated user cannot log in, and their name stays against everything they recorded. |
| designations | The `id` of each of the user's designations, from the `Designation` tab, separated by commas. Each must exist and be `current`, or the row errors. Leave blank for none. |
| allowedFacilities | The `id` of each facility the user is linked to, separated by commas. Leave blank to link the user to no facilities. What a link grants depends on the facility access settings: see [Facility access](02-settings.md#facility-access). |
| password | The password the user logs in with. Needed to create a user who can log in, but not checked by the importer, so a new user imported without one cannot log in until a password is set. Leave blank when updating a user to keep their current password. |

> [!WARNING]
> On re-import, the `designations` and `allowedFacilities` columns replace the user's existing values
> rather than adding to them. A blank cell removes all of the user's designations or facility links.

An export writes `designations` and `allowedFacilities` back as comma-separated ids, so an exported
sheet re-imports unchanged. An export has no `password` column, and re-importing it leaves every
user's password as it was.

### Managing users in the admin panel (supported from v2.44 onwards)

Users can also be added and edited one at a time on **Users** > **User profiles**. From v2.53 the
screen sits under the **Users** heading of the admin panel sidebar.

**[Screenshot: the User profiles screen, with Add user outlined]**

To add a user, select **Add user** and complete the form. **Display name**, **Role**, **Email**,
**Password** and **Confirm password** are required. **Email** and **Display name** must each be
unique, and display names are compared ignoring case. **Designation** and **Allowed facilities** each
accept several values.

**[Screenshot: the Add user window]**

To edit a user, select their row to open their **User profile**. The same fields can be changed, and:

- **Status** deactivates a user, by changing it from **Active** to **Deactivated**
- **Change password** sets a new password. Enter it in **New password** and **Confirm new password**

**[Screenshot: the User profile window]**

The device registration quota is set on the `User` tab only.

> [!WARNING]
> A user who edits their own profile is warned if the new role would remove their permission to edit
> user profiles. If they continue, another user with that permission must change their role back.

The accounts facility servers use to sync are not listed and cannot be edited here.

### Scheduling leave

Leave marks a user as unavailable for a range of dates. In a user's **User profile**, enter a
**Start date** and **End date** under **Schedule leave** and select **Schedule leave**. For a single
day, enter the same date twice. Leave cannot be scheduled in the past, or overlap the user's existing
leave.

Scheduling leave removes the user from any locations assigned to them on those dates. Upcoming leave
is listed under **Upcoming scheduled leave**, where **Remove** cancels it. See the
[Scheduling](../05-scheduling/) configuration guides for location assignment.

**[Screenshot: the Schedule leave section of a User profile, with upcoming leave listed]**

---

## Permission

The `Permission` tab is the permissions matrix: one row per permission, and one column per role,
marking which roles hold it.

| Field | Value |
| --- | --- |
| Tab name | `Permission` |

Where * is a required field.

| Column name | Description |
| --- | --- |
| verb * | The action permitted, such as `read` or `write`. See [Permission verbs](#permission-verbs). This column is not validated on import, so a misspelt verb is accepted and grants nothing. |
| noun * | The part of Tamanu the action applies to, such as `Patient` or `LabRequest`. Must match a noun in [Permissions](03-permissions.md) exactly, including case, or the row errors with `Noun is invalid or does not exist`. |
| objectId | Limits the permission to a single record, for the nouns that support it: a chart, form, report or program registry. Must be the id of an existing record, or the row errors with `Invalid objectId`. Leave blank to apply the permission to every record. See [Permissions for individual records](03-permissions.md#permissions-for-individual-records). |

After these columns comes one column for each role, headed with the role's `id` from the `Role`
tab. Each cell takes:

- `y`: the role is granted the permission
- `n`: the permission is revoked from the role
- blank: no change. A blank cell does not revoke a permission the role already holds

Any other value errors. A column headed `note` is ignored, so it can carry comments on a row.

> [!CAUTION]
> Imported permissions only take effect once **Use hardcoded permissions** is turned off. See
> [Permissions source](02-settings.md#permissions-source).

Roles granted the integration permissions used by external systems cannot also hold ordinary
permissions. An import that would give one role both errors. See
[Integrations](03-permissions.md#integrations).

An export writes `y` for a granted permission and `n` for a revoked one, and leaves a cell blank where
the role has never held the permission, so an exported matrix re-imports unchanged. A role with no
permissions at all has no column in the export.

### Editing permissions in the admin panel (supported from v2.53 onwards)

Permissions can also be granted and revoked on the **Edit** tab of the **Permissions** screen. See [Permissions](03-permissions.md#editing-permissions-in-the-admin-panel).

---

# Hard coded fields

The values these columns accept are set in the Tamanu code. Changing them requires a code change,
requested through a system administrator or project manager.

## Permission verbs

Used in the `verb` column of the `Permission` tab. Input the value exactly as shown, in lower case.
Each noun accepts only some verbs: see [Permissions](03-permissions.md) for which.

| Value | Meaning |
| --- | --- |
| list | View a list of records |
| read | View the details of a record |
| write | Change an existing record |
| create | Add a new record |
| delete | Delete a record |
| run | Run a report |
| submit | Submit a form |
| login | Log in to a facility |
| fhirIntegration | Connect an external system through an integration |
| manage | With the noun `all`, every permission in Tamanu |

## Visibility status

Used in the `visibilityStatus` column of the `User` and `Designation` tabs.

| Value | Meaning |
| --- | --- |
| current | In use. Shown as **Active** on a user's profile |
| historical | No longer in use. Shown as **Deactivated** on a user's profile |
