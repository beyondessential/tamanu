## certifiable_vaccines

Table of scheduled vaccines which can be certified via EUDCC or ICAO VDC.

Introduced during the COVID-19 pandemic, these are standards which can be
used to produce a QR code containing vaccine information and a digital signature
which certifies that the vaccines were administered by a competent authority.

This table both contains additional information about scheduled vaccines which is
required for those to be certified, and signals that the vaccines listed may be
included in certification QR codes.

See also the ``signers`` table.

## vaccine_id

Reference to a `Reference Data (vaccine)`
for the vaccine drug.

## manufacturer_id

Reference to a `Reference Data (manufacturer)`
for the organisation that manufactured the drug.

## icd11_drug_code

Free-text for the ICD11 code for the drug.

## icd11_disease_code

Free-text for the ICD11 code for the disease targeted by the drug.

## vaccine_code

SNOMED CT or ATC code for the vaccine type.

## target_code

SNOMED CT or ATC code for targeted disease.

## eu_product_code

EU authorisation code for the vaccine product.

## maximum_dosage

Maximum number of doses. Defaults to 1.

