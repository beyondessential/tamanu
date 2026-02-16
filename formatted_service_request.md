# FHIR ServiceRequest - Lab Order Details

## Basic Information
- **ID**: 49d6e54e-94a9-4fa6-bc4e-e3b46747b1a7
- **Version ID**: 1a203e4b-9937-4a1e-9508-5278bf4d82ec
- **Upstream ID**: 56e08718-d26a-4943-a1c3-635623be5550
- **Last Updated**: 2025-08-26 10:22:36.204
- **Status**: active
- **Intent**: order
- **Is Live**: true
- **Resolved**: true

## Identifiers
1. **Tamanu Lab Request ID**
   - System: `http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html`
   - Value: `56e08718-d26a-4943-a1c3-635623be5550`

2. **Tamanu Medical Record ID**
   - System: `http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html`
   - Value: `DT9NN3H`

## Test Information
**Test Type**: Full Blood Count (FBC)
- **System Code**: FBC (https://www.senaite.com/profileCodes.html)
- **LOINC Code**: 57022-6

## Category
- **SNOMED Code**: 108252007 (http://snomed.info/sct)

## Ordered Tests
### Blood Cell Counts
- **WBC** (White Blood Cell Count) - LOINC: 11156-7
- **RBC** (Red Blood Cell Count) - LOINC: 6742-1
- **PLT** (Platelet Count) - LOINC: 26515-7

### Hemoglobin & Hematocrit
- **HGB** (Hemoglobin)
- **HCT** (Hematocrit) - LOINC: 20570-8

### Red Blood Cell Indices
- **MCH** (Mean Corpuscular Hemoglobin) - LOINC: 28539-5
- **MCHC** (Mean Corpuscular Hemoglobin Concentration) - LOINC: 47279-5
- **MCV** (Mean Corpuscular Volume) - LOINC: 30428-7
- **RDW-CV** (Red Cell Distribution Width) - LOINC: 21000-5CV

### White Blood Cell Differential (Absolute Counts)
- **Neutrophils** - LOINC: 26511-6
- **Lymphocytes** - LOINC: 26478-8
- **Monocytes** - LOINC: 26485-3
- **Eosinophils**
- **Basophils** - LOINC: 30180-4
- **Mixed cells** (monocytes, basophils, eosinophils) - LOINC: 50957-0

### White Blood Cell Differential (Percentages)
- **Neutrophils %** - LOINC: %26511-6
- **Lymphocytes %** - LOINC: %26478-8
- **Monocytes %** - LOINC: %26485-3
- **Eosinophils %** - LOINC: %26450-7
- **Basophils %** - LOINC: %30180-4

## Patient Information
- **Reference**: Patient/6dc8a0e8-965d-4ee3-b124-62e5338cc91b
- **Display Name**: Test Patient

## Healthcare Provider
- **Reference**: Practitioner/74c699a4-b845-430a-8f18-6a0313cccb99
- **Display Name**: Templa Tau

## Clinical Context
- **Encounter**: Encounter/79ab69e1-64f9-4b28-bf3b-35db924457be
- **Specimen**: Specimen/c0afcd5b-aeb1-4c2e-942c-3050fb40095f
- **Occurrence Date**: 2025-08-25T10:31:56+12:00 (NZST)

## Notes
- **Note**: "Test"
- **Timestamp**: 2025-08-25T12:18:26+12:00 (NZST)

---
*This is a comprehensive Full Blood Count (FBC) laboratory request that includes complete blood cell analysis with differential white blood cell counts.*