# Review of draft proposal (Zimbabwe SHR)

Review of the latest full draft response, checked against the 2.2 Overview and against what Tamanu actually is (verified against the codebase where noted). Page numbers refer to the attached draft PDF.

---

## 1. Inconsistencies with the Overview and the doc's own SHR framing

- **The compliance annex is scoped to "Patient Master Index" only, which undercuts the Overview.** The Overview and Executive Summary sell Tamanu as a full longitudinal clinical SHR, but the annex is titled "Patient Master Index — Specification Compliance Annex", says everything is "scored against BES's Patient Master Index", and repeatedly pushes clinical capability out of scope (p22 "Broader clinical-trend and service-utilisation reporting sits in the EMR/BI layer (Tupaia), not the PMI itself"; p24 "clinical-condition/encounter-type search sits in the EMR layer"). An evaluator reading the Overview then the annex will think the offer has quietly narrowed from "SHR" to "patient index". Highest-priority fix: reframe the annex to score the Tamanu SHR, with the PMI as the identity layer within it, not the PMI alone.

- **"microservices" appears three times, one contradicting the correction.** Section F Software Architecture (p27) and Expected Performance (p29) were correctly rewritten to "hub-and-spoke ... not microservices", but both say "microservers" (typo for microservices). Edwin's CV (p35) still lists "5+ years experience RESTful / FHIR API development and Microservices architectures". The doc asserts and denies microservices within a few pages. Fix the typo and reconcile the CV line.

- **Six vs 9+ countries.** Overview and Executive Summary say national EHR in six countries; the Features bullet (p8) and Scalability row (p20) say "9+ countries"; Methodology names three (Nauru, Palau, Samoa). Edwin's and Rohan's CVs both say "six Pacific Island Countries". Standardise on six.

- **TLS 1.3 vs 1.2+.** p5 says "TLS 1.3 using elliptic curve cryptography"; the annex says "TLS 1.2+" in every security row (p19, p27, p28). TLS version is a deployment/Caddy setting. Use "TLS 1.2+" consistently and drop the specific "1.3 + elliptic curve" claim unless confirmed.

## 2. Claims that don't ring true of Tamanu

- **"machine-learning-enhanced pattern recognition" dedup and "probabilistic scoring" (p11-12).** There is no ML or probabilistic-matching code in Tamanu (verified: zero matches for machine-learning/probabilistic in the codebase). What exists is a real-time duplicate warning at registration (`DuplicatePatientWarningModal`) and an admin merge tool with audit trail (`administration/patientMerge`). The "five-layer framework ... database-wide ML-assisted reporting tool with models trained for regional naming variations" is not real and is easily punctured by a technical evaluator. Drop the ML framing; describe the real deterministic matching plus merge.

- **"React (Electron)" frontend (p27) and "React/Electron frontend" (Kiribati experience, p42).** The web app is a browser-based Vite/React app served by Caddy (the only "electron" reference left in the code is a stale comment). Other rows correctly say "browser-based (Chrome/Chromium/Edge)". "Electron" is inaccurate and inconsistent.

- **eLMIS conflated with mSupply, plus a direct contradiction on eLIMS.** p25 System Connections: "No prior eLIMS- or Impilo-specific integration." p28: "Live integrations ... exist for ... eLIMS mSupply." mSupply is BES's own supply system; Zimbabwe's eLMIS is a separate national logistics system. Presenting mSupply as the eLMIS integration is misleading, and the two rows disagree on whether an eLMIS integration exists. Reconcile.

- **Outbreak Detection cell contradicts itself (p14-15).** It says Tupaia "does not support automated syndromic/cluster detection", then immediately "Yes - there is a Syndromic Surveillance module ... with automated aberration detection". Pick the true statement (Pacific syndromic surveillance on Tupaia is real, so "yes" is likely defensible) and delete the contradicting sentence.

- **"existing HIV module / TB module / Maternal Health module" (Reports, p30).** Elsewhere the doc correctly says these are delivered via the configurable Program Registry module. The Reports section implies pre-built disease-specific modules exist. Keep it as "configurable program registries".

- **Care Continuity Notifications scored "Meets" but the note describes building it (p14).** The evidence says it "could be customised to deliver email alerts", which is Partially Meets, not Meets (it was Partially Meets in the prior draft). The note undercuts its own score.

- **Verify, do not assert:**
  - "one of only six accredited EMR/EHR systems globally, and the only one purpose-built for LMICs" (p4). OpenMRS and Bahmni are also LMIC-focused global goods, so "only one" is risky.
  - "registered not-for-profit" (p4 and Executive Summary). Confirm BES's actual legal status.
  - CPT coding support (p5). CPT is US-proprietary and unusual for Tamanu; likely does not belong.

## 3. Leftover placeholders and editorial

- **p32:** "Blurb about BES management structure. Personnel supported by Heads of" is an unfinished placeholder (same category as the old `>>> Edwin <<<`).
- **p30 Security Expert note is garbled:** "...health security expertise and experience. as a core responsibility. The open risk is the specific technology checklist" reads like an internal note left in.
- **Personnel name and role mismatches:** the summary table (p30) has Rohan Long as SHR Specialist and Edwin as Software Specialist; the CVs (p35-36) swap them (Edwin as SHR Specialist, Rohan Port as Software Specialist). Also Rohan Long vs Rohan Port, Felix Saparelli vs Sapparelli, Julianna vs Juliana. Fix names and align role labels.
- **Section numbering is jumbled:** body headings read "5. Relevant experience" (p39), "6. Workplan" (p46), "4. Budget" (p49), but the TOC has Workplan = 4 and Budget = 5, and Relevant experience is not in the TOC at all.

---

## Suggested priority order

1. Reframe the annex from PMI-scoped to SHR-scoped (biggest credibility gap against the Overview).
2. Remove the ML/probabilistic dedup claims; describe the real matching and merge.
3. Fix the microservices typo and CV line; reconcile the eLMIS/mSupply and eLIMS contradictions.
4. Remove placeholders and the garbled Security Expert note.
5. Standardise: six countries, TLS 1.2+, Electron to browser-based.
6. Fix personnel names, role labels, and section numbering.
