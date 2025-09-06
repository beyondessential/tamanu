{% docs __overview__ %}
# Database schemas

> [!NOTE]
> If you're looking at this in Slab, go instead here:
> <https://data.bes.au/tamanu/main/>

## Types of data

### 📚 Reference data (tag: `reference`)

System-wide configuration, lists (eg diagnoses, facilities, locations).
Also includes surveys and their questions, vaccination schedules, etc.

Populated centrally, synced down to all facilities and mobile devices.

Never considered sensitive/restricted.

### 📋 Clinical data (tag: `clinical`)

Patient medical records. 

Always attached to a Patient, often via an Encounter (almost all records with a patientId or an encounterId will be clinical data).

Always considered sensitive.

### 📁 Administration data (tag: `administration`)

Thematically pretty close to reference data, but distinct in that administration data is expected to change as part of normal day-to-day system operation (eg a user can change their password or email address outside of a project manager or admin reconfiguring the system).

### 🔧 System data (tag: `system`)

Data that is internal to Tamanu operation.

Local configuration, sync status, task queues etc.

Usually invisible to clinicians and PMs.

Sometimes sensitive (eg a queued email to a patient notifying them of a test result).

### 🚮 Deprecated/legacy data (tag: `deprecated`)

Entire tables that are deprecated.

This is an additional tag and should be accompanied by one of the above tags.

## Masking

Some columns have a `config.meta.masking` entry.
This indicates that the contents of the column should be masked for data anonymisation purposes, and how that should be done.
This masking definition is custom to Tamanu, to avoid locking ourselves into any particular masking software implementation.
The descriptions below are kept deliberately vague as to expected behaviour, so that implementations are able to vary.

The value of the entry is either a string (short form) or a map (extended form):

```yaml
config:
  meta:
    masking: something
```

is equivalent to:

```yaml
config:
  meta:
    masking:
      kind: something
```

The map (extended form) of the value _must_ have the `kind:` key, and may optionally have additional parameters to control masked data generation.

When masking, nulls are preserved.

### `truncate` table mask

Applies only at the table level instead of the column level.

The entire table is truncated.

### `date` and `datetime` masks

These can be applied to native postgres date(time) types like `timestamptz`, or to text-representation fields like `character(10)` and `character(19)`.

The difference between `date` and `datetime` is one of content, not data format: `date` masks will anonymise by varying across different dates, while `datetime` will try to preserve the date component but vary the time of day.

### `text` and `string` mask

This can be applied to `text`, `character varying`, and so on.

The generated content should be approximately the same length as the original.

For `string`, the content is random printable (ascii) characters without spaces.
For `text`, the content is random words and/or sentences.

### `email`, `name`, `phone`, `place`, `url` masks

These can be applied to `text`, `character varying`, and so on.

These are like the `text` mask, but should generate fake data in a particular shape.

For `name` masks, wherever possible the generator should detect whether the original has a space within, and if so generate a "full name", otherwise go for a single (first/middle/last) name.

### `zero` mask

This is a special mask that will keep the length of the data identical but replace it entirely with zeroes.

This is useful for `bytea` data.

### `empty` mask

This can be applied to almost every field type.

It deletes the value, without setting it to null.
For example, numbers become zero, strings become zero-sized, json(b)s become empty objects, etc.

### `nil` mask

This can be applied to columns that don't have a `not null` constraint.

It nulls the field.

### `default` mask

This can be applied to columns that have a default value.

It applies that value.

### `integer`, `float`, `money` masks

These can be applied to native number types and to `text` representations.

A `range` parameter can be provided as a pair of numbers to constrain the generated value:

```yaml
config:
  meta:
    masking:
      kind: integer
      range: 0-10.5
```

In the case of `money`, the value is generated as a float (for `numeric` columns) with two decimals.

{% enddocs %}
