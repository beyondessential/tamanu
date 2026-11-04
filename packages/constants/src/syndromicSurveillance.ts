// Syndromic surveillance is captured by the program form with the code "syndromicsurveillance" in
// the program with that same code. Program import derives a form's id from both codes, so this id
// identifies that form.
// TODO: A deployment that already uses the "syndromicsurveillance" program and form codes adopts
// that form as its syndromic surveillance form on upgrade, along with any responses it already has.
// Check whether any deployment does, and work out how to resolve it on upgrade if so.
export const SYNDROMIC_SURVEILLANCE_SURVEY_ID =
  'program-syndromicsurveillance-syndromicsurveillance';
