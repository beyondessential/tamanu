import { splitIds } from './utilities';
import { ICD10_DIAGNOSES } from './icd10';

export const TRIAGE_DIAGNOSES = splitIds(`
 Cardiorespiratory arrest
 Abdominal pain/distension
 Abnormal behaviour/mental state
 Allergic reaction
 Back pain
 Bleeding - from nose
 Bleeding - in stool
 Bleeding - in urine
 Bleeding - in vomit
 Bleeding - other
 Bleeding - vaginal
 Bleeding - with cough
 Cardiac - chest pain
 Cardiac - other
 Complication of diabetes
 Confusion
 Cough
 Decreased urine output
 Diarrhoea
 Difficulty breathing
 Difficulty walking
 Dizziness or general weakness
 Ear problem
 Eye problem
 Failure to thrive
 FB - inhaled/swallowed
 Fever or chills
 Flank pain
 Flu or cold-like symptoms
 Focal weakness or numbness
 Foreign body (FB) - in ear/nose
 Gender based violence (GBV)
 Genitourinary complaint
 Headache
 HIV - suspected/confirmed
 Hypo- or hyperglycaemia
 Injury
 Intoxication - deliberate self harm
 Intoxication - recreational
 Jaundice
 Limb pain
 Loss of appetite/decreased intake
 Loss of consciousness or faint
 Malaria - suspected/confirmed
 Mass
 Nausea or vomiting
 Non-acute wound or ulcer
 Other
 Pregnancy-related
 Rash
 Seizure or convulsion
 Swelling
 TB - suspected/confirmed
 Tooth problem
 Wheezing
`).map(data => ({ ...data, code: data.id, type: 'triageReason' }));

export const DIAGNOSES = [...TRIAGE_DIAGNOSES, ...ICD10_DIAGNOSES];
