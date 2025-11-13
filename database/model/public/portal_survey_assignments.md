{% docs table__portal_survey_assignments %}
Assignments of surveys to patients for completion through the patient portal.

This table tracks which surveys have been assigned to which patients for self-completion through
the patient portal application. Patients can log into the portal to view their assigned surveys
and complete them independently. Surveys can be assigned to patients for various purposes such as
health assessments, follow-up questionnaires, or program evaluations.
{% enddocs %}

{% docs portal_survey_assignments__patient_id %}
Reference to the [patient](#!/source/source.tamanu.tamanu.patients) who has been assigned the survey.
{% enddocs %}

{% docs portal_survey_assignments__survey_id %}
Reference to the [survey](#!/source/source.tamanu.tamanu.surveys) that has been assigned to the patient.
{% enddocs %}

{% docs portal_survey_assignments__status %}
The current status of the survey assignment in the patient portal.

One of:
- `assigned` - Survey has been assigned but the patient has not yet started it in the portal
- `in_progress` - Patient has started the survey in the portal but not completed it
- `completed` - Survey has been fully completed by the patient through the portal
- `expired` - Survey assignment has expired and can no longer be completed in the portal
{% enddocs %}

{% docs portal_survey_assignments__assigned_by_id %}
Reference to the [user](#!/source/source.tamanu.tamanu.users) who assigned the survey to the patient.
{% enddocs %}

{% docs portal_survey_assignments__survey_response_id %}
Reference to the [survey response](#!/source/source.tamanu.tamanu.survey_responses) containing the patient's answers from the portal.

This field is only populated when the survey has been completed through the patient portal and a response has been recorded.
{% enddocs %}

{% docs portal_survey_assignments__assigned_at %}
Timestamp when the survey was assigned to the patient for completion through the patient portal.

This field is provided a value by the Tamanu web frontend when a survey assignment is created.
{% enddocs %}

{% docs portal_survey_assignments__facility_id %}
The facility that the survey was assigned from
{% enddocs %}
