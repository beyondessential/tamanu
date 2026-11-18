# AI summaries leave out sensitive lab tests and medications

## Patient summary

- [x] A lab request holding a sensitive test type is left out, while one holding only ordinary test types is kept (verifies spec: AISUM)
- [x] A prescription of a sensitive drug is left out, both when prescribed in an encounter and when ongoing (verifies spec: AISUM)
- [x] A prescription of a drug with no drug details recorded is kept
- [ ] Generating a summary as a user who may read sensitive lab requests and medications still leaves them out (verifies spec: AISUM)

## Encounter summary

- [x] A lab request holding a sensitive test type is left out (verifies spec: AISUM)
- [x] A prescription of a sensitive drug is left out (verifies spec: AISUM)
