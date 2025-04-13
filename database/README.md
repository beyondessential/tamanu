{% docs __overview__ %}
# Database schemas

> [!NOTE]
> If you're looking at this in Slab, go instead here:
> <https://data.bes.au/tamanu/main/>

## Types of data

### 📚 Reference data (tag: `reference`)

System-wide configuration, lists (eg diagnoses, facilities, locations).
Also includes surveys and their questions, vaccination schedules, etc.

Populated centrally, synced down to all facilities and mobile devices.

Never considered sensitive/restricted.

### 📋 Clinical data (tag: `clinical`)

Patient medical records. 

Always attached to a Patient, often via an Encounter (almost all records with a patientId or an encounterId will be clinical data).

Always considered sensitive.

### 📁 Administration data (tag: `administration`)

Thematically pretty close to reference data, but distinct in that administration data is expected to change as part of normal day-to-day system operation (eg a user can change their password or email address outside of a project manager or admin reconfiguring the system).

### 🔧 System data (tag: `system`)

Data that is internal to Tamanu operation.

Local configuration, sync status, task queues etc.

Usually invisible to clinicians and PMs.

Sometimes sensitive (eg a queued email to a patient notifying them of a test result).

### 🚮 Deprecated/legacy data (tag: `deprecated`)

Entire tables that are deprecated.

This is an additional tag and should be accompanied by one of the above tags.

{% enddocs %}