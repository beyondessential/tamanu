{% docs table__certifiable_vaccines %}
Table of scheduled vaccines which are eligible for inclusion in COVID-19 vaccine certificates.

This table signals which vaccines may be included in the COVID-19 vaccine certificate printout.
{% enddocs %}

{% docs certifiable_vaccines__vaccine_id %}
Reference to a [Reference Data](#!/source/source.tamanu.tamanu.reference_data) (`type=vaccine`)
for the vaccine drug.
{% enddocs %}

{% docs certifiable_vaccines__manufacturer_id %}
Reference to a [Reference Data](#!/source/source.tamanu.tamanu.reference_data) (`type=manufacturer`)
for the organisation that manufactured the drug.
{% enddocs %}

{% docs certifiable_vaccines__icd11_drug_code %}
Free-text for the ICD11 code for the drug.
{% enddocs %}

{% docs certifiable_vaccines__icd11_disease_code %}
Free-text for the ICD11 code for the disease targeted by the drug.
{% enddocs %}

{% docs certifiable_vaccines__vaccine_code %}
SNOMED CT or ATC code for the vaccine type.
{% enddocs %}

{% docs certifiable_vaccines__target_code %}
SNOMED CT or ATC code for targeted disease.
{% enddocs %}

{% docs certifiable_vaccines__eu_product_code %}
EU authorisation code for the vaccine product.
{% enddocs %}

{% docs certifiable_vaccines__maximum_dosage %}
Maximum number of doses. Defaults to 1.
{% enddocs %}
