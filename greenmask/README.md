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

This folder has subfolders, which can be used to either apply the full suite of
masking, or only up to a set sensitivity level:

- `high`: masking for data that should never leave a production environment
- `medium`: data masked to this level can be used for analytics purposes
- `low`: data masked to this level can be used for simulation or testing
