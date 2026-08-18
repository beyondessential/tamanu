<!--
Canonical format example for the Draft release notes skill.
This is the published Tamanu v2.44 release notes, kept verbatim as the reference
for section order, headings, emoji markers, voice, and level of detail.
Match this shape when drafting a new version. Slab links here are real; in a
fresh draft they are left as [SLAB_LINK_PLACEHOLDER].
-->

Released 17-11-2025

One of our biggest recent releases - Tamanu v2.44 introduces the new Patient Portal feature that enables secure patient engagement outside of clinical settings. It additionally introduces major enhancements to user and location scheduling management.

---

# 🌟 Major Features and Changes

## Tamanu Desktop

### _Location Bookings Calendar Enhancements_

Significant enhancements to the **Location Bookings** calendar provide more flexibility and detail when scheduling patient bookings. The addition of a daily calendar alongside the existing weekly calendar gives users different views on the schedule, while new fields capture more comprehensive booking information to better support use cases such as surgical lists.

**Key features**

- **Daily calendar view** - Switch between daily and weekly views using a toggle. The daily view shows a time-based schedule for a single day with assigned clinicians across the top and locations underneath. Booking tiles reflect the actual length of bookings, making it easy to see schedule density at a glance.
- **Enhanced booking fields** - When creating bookings, the following additional information can now be captured:
    - Additional clinician - Record secondary clinicians such as anaesthetist involved in the booking.
    - Procedure type - Specify the type of procedure being booked for a surgical/procedure booking.
    - Linked encounter - Associate the booking with an existing encounter from the past 6 months, enabling continuity tracking across bookings and care episodes.
- **Improved 'isBookable' configuration** - Location groups can now specify whether locations should appear on the daily view only, weekly view only, or both views. This provides more granular control over calendar visibility based on how different areas are scheduled.
- **View state persistence** - The calendar remembers a user's last selected view (daily or weekly) and active filters when they navigate away from and return to the calendar.
- **Scheduled leave visibility** - When a clinician with scheduled leave is selected while creating a booking, a warning appears to inform the user that the clinician may not be available.

**Supporting documentation**

- Feature overview - [v2.44 Location Bookings Enhancements: Feature overview](https://beyond-essential.slab.com/posts/ryl47b3u)
- Configuration guide - [Scheduling: Configuration guide](https://beyond-essential.slab.com/posts/aeo5nozn)
- User manual -[19.1 Scheduling](https://beyond-essential.slab.com/posts/csc19j84#h8wph-19-1-2-location-bookings)

---

## Patient Portal

The Patient Portal is a new patient-facing web application that enables secure engagement between healthcare facilities and their patients outside of clinical encounters. Through the portal, patients can access information and complete forms from home, improving convenience and data accuracy.

**Key features**

- **Patient portal dashboard** - Provides patients with a comprehensive view of their health information in a clear, easy-to-understand format. Health records displayed include upcoming appointments, ongoing conditions, allergies, ongoing medications, upcoming and administered vaccinations.
- **Secure patient registration** - Clinicians can register patients for portal access from within Tamanu Desktop. An email invitation is sent to the patient with a unique registration link.
- **Form distribution** - Clinicians can send forms to the portal for patient completion. Forms appear in the patient's outstanding forms list, ready to be completed at their convenience.
- **Form submission** - Patients complete assigned forms through an intuitive interface that supports a wide range of question types. Submitted responses are stored in Tamanu and appear in the patient's record just like forms completed in person.
- **Outstanding forms tracking** - Outstanding forms can be viewed in Tamanu Desktop for follow-up with patient if required.

**Security considerations**

The Patient Portal maintains the same security standards as Tamanu Desktop, with separate authentication and encrypted data transmission. Patients can only access their own information.

**Keen to implement the Tamanu Patient Portal?**

Please reach out to your Tamanu system administrator/project manager to discuss implementation details.

**Supporting documentation**

- Feature overview - [v2.44 Patient Portal: Feature overview](https://beyond-essential.slab.com/posts/zd0302j8)
- Configuration guide - [Patient Portal: Configuration guide (supported from v2.44 onwards)](https://beyond-essential.slab.com/posts/mdfhiw37)
- User manual - [Section 20 - Patient Portal (supported from v2.44 onwards)](https://beyond-essential.slab.com/topics/7ckf9idj)

---

## System Administration

### _User Management Admin Panel_

The new User Management component in the admin panel provides administrators with tools to manage Tamanu users. This enhancement centralises user administration, making it easier to maintain accurate user records, manage access, and oversee staff scheduling.

**Key features**

- **Users table** - View all active and deactivated users in a sortable, searchable table displaying key user details.
- **User profile management** - Click on any user to view and edit their details including display name, display ID, role, designation, email, phone, status, and allowed facilities. Password changes can also be made directly from the user profile.
- **Create new users** - Add new users directly through the admin panel. The system validates that display names and email addresses are unique.
- **Schedule user leave** - Record upcoming leave periods for users to ensure their availability is accurately reflected in location assignments. The system automatically handles conflicts by removing location assignments that overlap with scheduled leave.

**Supporting documentation**

- User management user manual - [Users: Creating and managing users](https://beyond-essential.slab.com/posts/1alb5tf3#hla9g-managing-users-via-the-admin-panel-available-from-v-2-44-onwards)

---

### _Location Assignment Calendar_

The Location Assignment Calendar introduces a visual weekly calendar for managing clinician assignments to specific locations. These location assignments are specifically displayed on the location bookings 'Daily' view on the Tamanu Desktop frontend.

This tool helps administrators plan and track which staff members are working in which areas, supporting better resource allocation and schedule coordination.

**Key features**

- **Weekly calendar view** - Visual calendar displaying all bookable locations organised by location group, with days shown across the top. The current week is automatically displayed on load with the ability to navigate to other months.
- **Create location assignments** - Assign clinicians to specific locations and time slots by facility. Assignments include user, area (location group), location, date, and allocation time based on facility booking settings.
- **Repeating assignments** - Create recurring assignments with configurable frequency (daily, weekly, etc.) and end date.
- **Manage assignments** - Edit existing assignments to update the location, date, or time.
- **Conflict handling** - The system warns administrators when attempting to create assignments that conflict with scheduled leave or existing assignments, allowing them to resolve issues before saving.

**Supporting documentation**

- Configuration guide/user manual  - [Location Assignments: Admin panel (supported from v2.44 onwards)](https://beyond-essential.slab.com/posts/ndwgf44x)

---

# 🔧 System Enhancements

### _DHIS2 Integration_

This release introduces integration capabilities with DHIS2, enabling automated data sharing between Tamanu and DHIS2. This integration supports health information exchange and reporting workflows required by many health ministries.

**Key features**

- **Report selection configuration** - Administrators can configure which Tamanu reports should be automatically sent to DHIS2 through a JSON-based settings system. Reports can be added or removed as required.
- **Scheduled data push** - A scheduled task automatically runs selected reports at configured intervals (minimum daily frequency) and sends the data to DHIS2. All transmissions are logged for auditing purposes.
- **Connection retry system** - Robust retry logic with backoff ensures that temporary connection issues do not result in data loss. Failed transmissions are automatically retried.

**Keen to implement the DHIS2 integration?**

Please reach out to your Tamanu system administrator/project manager to discuss implementation. They will put you in touch with our integration and data team to support this.

---

# 🐛Tweaks and Bug Fixes

## Desktop

**_Create encounter modal_**

- The create encounter modal has been redesigned with colour-coded encounter types for improved usability and visual clarity.

**_Referrals_**

- Updated the referral dropdown to sort items alphabetically in a case-insensitive manner, ensuring consistent ordering regardless of capitalisation.

**_Encounter notes_**

- Fixed an issue where note type translations were not being applied when creating a new note. Translation strings are now correctly displayed in the note type dropdown.

**_Vaccination certificate_**

- Long vaccination names now wrap across multiple rows in vaccination certificates rather than being hyphenated, matching the display format used in the recorded vaccines table.

**_Scheduling_**

- Significant performance improvements to the upcoming appointment/booking tables on the patient landing page. This feature can now be confidently enabled across all deployments. See [Scheduling: Configuration guide](https://beyond-essential.slab.com/posts/aeo5nozn#h6e2h-turn-on-patient-level-appointment-bookings)  for further details on this setting.
- The 'Area' field now automatically populates when creating an encounter from an outpatient appointment.

**_Entity hierarchy_**

- Fixed an issue where location hierarchy fields would not display correctly when the hierarchy contained only division and subdivision levels. The system now correctly handles this hierarchy configuration.
- See [Reference Data: Hierarchies and Entity Relationships](https://beyond-essential.slab.com/posts/3uiexr86#h9zmd-location-hierarchy)  for further details on location hierarchies.

---

# ⚠️ Critical Upgrade Notes

### Required

**_User Management and Location Bookings_**

- Review the new User Management admin panel and plan how your team will use it to manage user accounts and scheduled leave. Consider which staff need permissions to manage user accounts.
- Familiarise yourself with the Location Assignment Calendar and determine how it will support your resource allocation processes. Configure location bookings settings (`appointments.bookingSlots.startTime`, `appointments.bookingSlots.endTime`, `appointments.bookingSlots.slotDuration`) at the facility level if not already set.
- Update reference data for location groups to specify `isBookable` values (all, weekly, daily, or no) based on how each area should appear in booking calendars.

**Optional**

**_Patient Portal_**

- Review the Patient Portal feature and determine if it is appropriate for your deployment.
- If implementing the portal, request devops to setup portal.
- Set up appropriate permissions for staff who will register patients and assign portal forms.

**_DHIS2 Integration_**

- If your facility reports to DHIS2, review the integration capabilities and determine which Tamanu reports should be automatically sent to DHIS2.
- Configure DHIS2 connection settings and test the integration in a non-production environment before deploying to production.

---

## Upgrade Steps and Recommended Testing

### Required

### _User Management_

- Test user creation, editing, and leave scheduling through the new admin panel

**Optional**

**_Location Bookings_**

- Verify that location schedule assignments work as expected for your bookable locations
- Test both daily and weekly views of the location bookings calendar with real appointment scenarios
- Confirm that facility filtering works correctly in multi-facility deployments
- Verify that permissions control access appropriately for user management and scheduling features

### _Patient Portal_

- Test the complete patient registration workflow from invitation to login
- Verify that forms can be assigned to patients and completed through the portal
- Confirm that form submissions appear correctly in patient records
- Test permission controls to ensure only authorised staff can manage portal access

### _DHIS2 Integration_

- If enabling DHIS2 integration, test the scheduled report execution and data push to DHIS2
- Verify that connection retry logic works appropriately

### _General_

- Test all bug fixes mentioned in the release notes
- Verify that existing workflows continue to function as expected
