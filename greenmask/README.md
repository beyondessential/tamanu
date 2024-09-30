# Database masking configurations

Each YML file in this directory tree is a fragment of a
[Greenmask](https://greenmask.io/latest/configuration/#dump-section) config
which specifies how to mask data when taking snapshots of the database for
non-backup purposes.

These fragments are interpreted by the `greenmask-config` subcommand of the
[bestool](https://github.com/beyondessential/bestool), which compiles a full
greenmask config:

```console
bestool tamanu greenmask-config /path/to/this/folder... > config.yml
```

Each file should cover (some or all fields of) one table. You can have multiple
files covering one table; transforms will stack. Here's a template:

```yml
---
schema: public
name: tablename
transformations:
- name: RandomDate
  params:
    min: "2023-01-01 00:00:00.0+03"
    max: "2023-01-02 00:00:00.0+03"
    column: column_name
```

Subfolders are used to control down to which sensitivity level data should be masked:

- `high/`: masks high-sensitivity data that should never leave production
  - Data masked to this level becomes medium-sensitivity, and can be used for analytics purposes.
  - `high/legacy/`: legacy, deprecated, and obsolete fields which are always nulled
  - `high/notes/`: freeform contents of notes; nulls are preserved so presence/absence can be used for analytics
  - `high/personal/`: personally-identifiable information
- `medium/`: masks medium-sensitivity data that should be handled with care
  - Data masked to this level becomes low-sensitivity, and can be used for simulation or testing.
  - `medium/high/`: symlink to `high/`
  - `medium/dates/`: clinically-relevant dates
