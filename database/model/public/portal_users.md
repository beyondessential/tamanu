{% docs table__portal_users %}
This table manages user accounts for patients who can access the patient portal. It establishes the relationship between patients and their portal login credentials, tracking their registration status and access permissions. Each record represents a patient's portal account with authentication and role information.
{% enddocs %}

{% docs portal_users__patient_id %}
Foreign key reference to the patients table. Links the portal user account to a specific patient record in the system. This field is required and establishes the one-to-one relationship between a patient and their portal access.
{% enddocs %}

{% docs portal_users__email %}
Email address used for patient portal authentication and communication. Several patients can share one email (for example, a parent and their children), and signing in with it gives access to every registered patient that uses it.
{% enddocs %}

{% docs portal_users__status %}
Current registration status of the patient portal account. Possible values are 'pending' (default, when account is first created) and 'registered' (when patient has completed the registration process). This field tracks the progression of patient portal onboarding and account activation.
{% enddocs %}
