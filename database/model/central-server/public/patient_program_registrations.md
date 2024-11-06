{% docs table__patient_program_registrations %}
Table with information about the program registrations of a patient. This is helpful
to enroll a specific patient within a program that will be followed for an extended
period of time.

**This table is append-only.**
A new record is created every time there is a change to the status of a registration. 

At the moment, this implies that when merging two patients, both with a registration to the same
registry, the merged patient ends up with two registrations.
{% enddocs %}

{% docs patient_program_registrations__registration_status %}
The current status of the registration.

One of:
- `active`
- `inactive`
- `recordedInError`
{% enddocs %}

{% docs patient_program_registrations__patient_id %}
Reference to the [Patient](#!/source/source.tamanu.tamanu.patients).
{% enddocs %}

{% docs patient_program_registrations__program_registry_id %}
Reference to the [Program Registry](#!/source/source.tamanu.tamanu.program_registries)
of the registration.
{% enddocs %}

{% docs patient_program_registrations__clinical_status_id %}
Reference to the [Program Registry Clinical Status](#!/source/source.tamanu.tamanu.program_registry_clinical_statuses)
of the registration.
{% enddocs %}

{% docs patient_program_registrations__clinician_id %}
Reference to the [Clinician](#!/source/source.tamanu.tamanu.users) recording that
registration.
{% enddocs %}

{% docs patient_program_registrations__registering_facility_id %}
Reference to the [Facility](#!/source/source.tamanu.tamanu.facilities) where the
registration was registered in.
{% enddocs %}

{% docs patient_program_registrations__facility_id %}
Reference to the [Facility](#!/source/source.tamanu.tamanu.facilities) this program
registration is from.
{% enddocs %}

{% docs patient_program_registrations__village_id %}
Reference to the [Reference Data](#!/source/source.tamanu.tamanu.reference_data)
(`type=village`) this program registration is from.
{% enddocs %}

{% docs patient_program_registrations__is_most_recent %}
A boolean that represents whether this is the most recent registration for this
specific program registry.
{% enddocs %}
