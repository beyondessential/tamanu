{% docs table__scheduled_vaccines %}
A vaccine schedule listing all vaccines expected to be given to a child as part of a country wide Expanded Program of 
Immunisation can be incorporated into Tamanu to show each dose and due date on the front end of the system. 

First dose of a vaccine should use `weeks_from_birth_due` whilst subsequent doses should use 
`weeks_from_last_vaccination_due`.
{% enddocs %}

{% docs scheduled_vaccines__id %}
Tamanu identifier for vaccine schedules
{% enddocs %}

{% docs scheduled_vaccines__category %}
Vaccine category [Routine, Catch-up, Campaign, Other]
{% enddocs %}

{% docs scheduled_vaccines__label %}
Contents of the label column is what will be displayed on the front end of Tamanu 
under fields labelled 'Vaccine'. This is where the vaccine name is listed. E.g. 'BCG'.
{% enddocs %}

{% docs scheduled_vaccines__dose_label %}
Dose label indicates what will appear on the front end of Tamanu re when the dose is due. It can be a time in a child's 
life (e.g. 'Birth', '6 weeks') or a dose of vaccine (e.g. 'Dose 1', 'Dose 2')
{% enddocs %}

{% docs scheduled_vaccines__weeks_from_birth_due %}
This column is used to tell Tamanu how many weeks from the child's date of birth a vaccine is due. This will populate 
the front end within the Vaccine schedule section in the column 'Due date'. For a vaccine to appear in the Vaccine 
schedule a dose must have a `weeksFromBirthDue` entered into the reference data. 

This field should be used only for the first dose of the vaccine. Subsequent doses should use 
`weeks_from_last_vaccination_due`
{% enddocs %}

{% docs scheduled_vaccines__index %}
This column is used to show when a second dose is due in relation to the first dose. For example, if dose 1 is due at 6 
weeks and dose 2 is due at 10 weeks, this column would read '4' against the 10 week dose as dose 2 is due 4 weeks after 
dose 1 is given.
{% enddocs %}

{% docs scheduled_vaccines__vaccine_id %}
Use the vaccineId column to link the id column of the Reference Data sheet Drug to the vaccine schedule. Copy the exact 
id from the id column in the reference data sheet Drug and paste it in the vaccineId column in the Scheduled Vaccine 
sheet.
{% enddocs %}

{% docs scheduled_vaccines__weeks_from_last_vaccination_due %}
This column is used to show when a second dose is due in relation to the first dose. For example, if dose 1 is due at 6 
weeks and dose 2 is due at 10 weeks, this column would read '4' against the 10 week dose as dose 2 is due 4 weeks after 
dose 1 is given. The order of a vaccine dose is defined at the `index` field. 

This field should not be used for the first dose but for subsequent doses. First dose should use `weeks_from_birth_due`
{% enddocs %}

{% docs scheduled_vaccines__hide_from_certificate %}
Vaccines can be hidden from the vaccine certificate where required

To hide a vaccine from appearing on the vaccine certificate across the deployment, use column hideFromCertificate
- true = vaccine will not appear on the vaccine certificate
- blank / false = vaccine will appear on the vaccine certificate
{% enddocs %}

{% docs scheduled_vaccines__sort_index %}
Sort index defaults to 0
{% enddocs %}
