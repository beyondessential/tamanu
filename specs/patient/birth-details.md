---
id: BIRTH
---

# Birth details

The details of a newborn's birth, recorded when a birth is registered and held on the patient's record. They appear under **Birth details** in the register birth modal and in the patient's details for patients registered as births.

## Fields

- [ ] Birth details are recorded in this order: Time of birth, Gestational age (weeks), Place of birth, Name of health facility (if applicable), Attendant at birth, Name of attendant, Delivery type, Single/Plural birth, Birth order, Birth weight (kg), Birth length (cm), Head circumference (cm), Apgar score at 1 min, Apgar score at 5 min, Apgar score at 10 min
- [ ] Gestational age is a number of weeks from 1 to 45
- [ ] Birth order is a number from 1 to 10
- [ ] Birth weight is a number of kilograms from 0 to 6
- [ ] Birth length is a number of centimetres from 0 to 100
- [ ] Each Apgar score is a number from 1 to 10

## Head circumference

- [ ] Head circumference (cm) is the newborn's head circumference in centimetres, entered as a number
- [ ] Any positive number is accepted, decimals included
- [ ] Head circumference is optional unless an administrator makes it mandatory
- [ ] A recorded head circumference is saved with the patient's birth details and shown when the patient's details are opened
- [ ] A recorded head circumference syncs with the rest of the patient's birth details, so it is available at every facility the patient's record reaches

## Configuration

- [ ] An administrator can hide any birth details field, which then does not appear on the register birth modal or the patient's details
- [ ] An administrator can make any birth details field mandatory, which requires it to be filled in before a birth can be registered
- [ ] Each field's label is translatable
