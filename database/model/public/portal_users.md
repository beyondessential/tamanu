{% docs table__portal_users %}
This table manages user accounts for patients who can access the patient portal. It establishes the relationship between patients and their portal login credentials, tracking their registration status and access permissions. Each record represents a patient's portal account with authentication and role information.
{% enddocs %}

{% docs portal_users__patient_id %}
Foreign key reference to the patients table. Links the portal user account to a specific patient record in the system. This field is required and establishes the one-to-one relationship between a patient and their portal access.
{% enddocs %}

{% docs portal_users__email %}
Unique email address used for patient portal authentication and communication. This serves as the primary identifier for login purposes and must be unique across all patient portal accounts. The field is optional to allow for patients who may not have email addresses, or who have not yet completed the
registration flow.
{% enddocs %}

{% docs portal_users__status %}
Current registration status of the patient portal account. Possible values are 'pending' (default, when account is first created) and 'registered' (when patient has completed the registration process). This field tracks the progression of patient portal onboarding and account activation.
{% enddocs %}
