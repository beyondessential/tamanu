---
id: PROGRAMS
---

# Programs

Applies to programs, surveys, and form submissions.

## Calculated questions

- A calculated question or result works out its value from a calculation written in math.js expression syntax, reading other answers in the survey by their question code.
- A calculation is built from numbers, text and true/false values, question codes, the constants `pi` and `e`, brackets, and conditional expressions (`condition ? a : b`).
- The operators a calculation can use are `+`, `-`, `*`, `/`, `%` (or `mod`), `^`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `xor` and `not`.
- The functions a calculation can call are `abs`, `sign`, `round`, `ceil`, `floor`, `fix`, `sqrt`, `cbrt`, `nthRoot`, `square`, `cube`, `exp`, `log`, `log10`, `log2`, `min`, `max`, `sum`, `prod`, `mean`, `median`, `hypot`, `gcd`, `lcm`, `compare`, `isNaN`, `isZero`, `isPositive`, `isNegative`, `isInteger` and `number`, and the function form of each operator above (`add`, `subtract`, `larger`, `and` and so on).
- A calculation that does not parse, uses anything outside this vocabulary, or reads a code that is not a question in the survey, has no value.
- Importing a survey rejects a calculation that does not parse or uses anything outside this vocabulary, naming the part it does not support.

## AI form builder previews

- Each form preview the AI form builder produces is checked against everything saving it into the selected program would check, without saving anything.
- Problems the check finds go back to the builder to correct, a limited number of times, and the builder's reply describes each correction it made.
- A preview that still has problems after that names them in the reply, so saving it never fails unannounced.
- A preview the check could not run on says so in the reply, keeping any corrections already made.

> [!NOTE]
> A problem such as a patient data question reading a field that does not exist would otherwise surface only as a save error, after the user has approved the preview. Correcting it first keeps the conversation the place where the form gets fixed.
