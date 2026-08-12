# Preset label missing unit information display

## Investigation findings

Selecting a preset label replaces the whole Label text field with the preset's
reference data `name`, verbatim. `resolvePresetLabelText` in
`packages/web/app/utils/medications.jsx` is a plain lookup: preset id in, preset
`name` out, with the prescription-derived default only used as the fallback when
the selection is cleared.

"Take one twice daily" is not generated text. It is the seeded default
provisioning row for code `BD` in
`packages/central-server/app/subCommands/defaultProvisioningData/Medication Preset Label.json5`.

The unit appears in the pre-preset value ("Take 1 tablet immediately, oral.")
because that string is derived from the prescription by `buildLabelText` — dose
amount, long-form unit (`DRUG_UNIT_LABELS` / `DRUG_UNIT_PLURAL_LABELS`),
frequency, route, duration. A preset carries none of that: it is static text
shared across every medication, with no token substitution mechanism.

`resolvePresetLabelText` is byte-identical on release/2.61, release/2.62 and
main, which matches the reporter seeing the same behaviour on 2.61.

The stored `medication_dispenses.instructions` column holds the Label text, and
that is what prints on the sticker, so the printed label carries no unit either.
The field stays editable, so a pharmacist can type the unit in by hand.

## Options if the unit should appear

- **Reference data only.** Deployments author preset names that name the unit
  ("Take one tablet twice daily"). Cheap, but a preset then only suits one dosing
  unit — the same `BD` row can't serve tablets, millilitres and injections.
- **Presets contribute part of the sentence.** Treat a preset as the
  frequency/timing clause and keep the prescription-derived dose and unit, so
  `BD` on a tablet prescription yields "Take 1 tablet twice daily". Changes what
  a preset means and needs the reference data reworded to clause form.
- **Tokens in preset names.** Support replacements such as `:dose` and `:unit` in
  the preset name, resolved against the prescription at selection time. Most
  flexible, most authoring burden, and needs a fallback for prescriptions with no
  unit set.

Second and third options are product decisions and need a spec before code.

## Related observation

The suggester returns raw `reference_data` rows, so the Label text takes the
untranslated `name` even where a deployment has translated the preset label.
Preset text on a non-English deployment stays English unless the DB `name`
itself is authored in that language.
