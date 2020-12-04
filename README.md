# Tamanu
> This is a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

[ ![Codeship Status for beyondessential/tamanu](https://app.codeship.com/projects/9355b080-d34d-0136-45ef-2e8db6e7ba42/status?branch=codeship)](https://app.codeship.com/projects/316346)

The monorepo has four main components:

* [desktop](packages/desktop): the main Electron app
* [lan](packages/lan): the local server, which the app communicates with
* [sync-server](packages/sync-server): the synchronisation server, which lan server and mobile client instances communicate with to synchronise data
* [shared-src](packages/shared-src): shared code among Tamanu components

Additionally:

* [shared](packages/shared): the build output of the `shared-src` module (ignored by version control)

## Install

First, clone the repo via git:

```bash
$ git clone git@github.com:beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu
$ # Enable yarn workspaces
$ yarn config set workspaces-experimental true
$ yarn config set workspaces-nohoist-experimental true
$ yarn
```

## Configure

The modules use `config`, which helps manage different configurations easily. Each module has a
`config/` directory, with several files in it. The base configuration is in `config/default.json`,
and the values there will be used unless overridden by a more specific configuration (for eg
`config/development.json`). 

The local configuration (`config/local.json`) will always take highest precedence and should not 
be checked into version control. This file should contain the information for database configuration,
local credentials, etc.

The [`config` docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files) have more info on how that works.

## Run

### LAN server

The Tamanu desktop app needs a lan server running to operate correctly. For
local development, this can just be another process on the same host.

```bash
$ yarn lan-start-dev
```

This will start a build & watch process on the lan server and the shared directory.

If you're working on backend functionality, it's much, *much* quicker easier to drive development 
with testing. You can set up predictable test data rather than having to click through a bunch of 
UI screens every time, and the live-reload turnaround is way faster than the desktop version. (this
is in addition to the fact that any backend functionality should have tests against it anyway)

The lan server uses sequelize to manage database connections, and can switch between sqlite and postgres.
The development config (`packages/lan/config/development.json`) sets the `db.sqlitePath` config variable,
which causes the app to use sqlite as a database - this is to make initial setup easier. If you have 
postgres available, set the appropriate connection variables in your `local.json`, making sure to
set `sqlitePath` to `""` so the postgres connection is respected.

When the app detects an empty or missing db on startup, it'll run an importer on an excel file to populate all the initial patients, users and reference data.
- the app will classify the db as empty if it has no users in it
- the initial definitions file to import is defined in `config.initialDataPath` (`packages/lan/data/demo_definitions.xlsx` by default)
- by default, the database is an sqlite db at `packages/lan/data/tamanu-dev.db`; deleting that file and restarting the lan process to trigger the import is the quickest way to get a fresh database
- this is also true for production! initial production deployment expects a data definition document to be provided

### Desktop app

Once there is a LAN server up and running, run this to start the Electron app for development.

```bash
$ yarn desktop-start-dev
```

Note that we also use storybook to develop components in isolation, which you can run from within
the desktop directory using `yarn storybook`.

### Sync server

Start a mongod instance on your local machine. Once mongodb has started, run

```bash
$ yarn sync-start-dev
```

## Integrations

### Senaite

*NB: The Senaite integration is currently non-functional*

Senaite is disabled by default. To enable it, update your config/local.json to include the Senaite
information. The most relevant key is `enabled: true` but you'll almost certainly have to update
the API url and login credentials as well (see config/default.json for how this should be structured).

## CI / CD
> **Note: [codeship pro](https://codeship.com/features/pro) is required**

### Setup
- install [Jet CLI](https://documentation.codeship.com/pro/jet-cli/installation/)
- download your codeship project's AES key from *Project Settings*
- use  [SSH helper](https://github.com/codeship-library/docker-utilities/tree/master/ssh-helper) to generate SSH keys
- populate `codeship.env` with environment variables defined below
- use [jet encrypt](https://documentation.codeship.com/pro/jet-cli/encrypt/) to encrypt ENV variables e.g `jet encrypt codeship.env codeship.env.encrypted`
- make sure that `codeship.env` is kept safe or remove it
- use `jet` cli to test build pipelines e.g `jet steps --tag "dev"`

### Pipeline
- `dev` and `master` branches trigger build automatically
- `master` branch requires a manual action to trigger deployment
- `desktop` and `lan` builds are pushed to S3
- `server` build gets deployed to an AWS EC2 instance

### Environment variables
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: AWS auth keys with S3 write access
- `CONFIG_DESKTOP`: desktop config `single lined env variables` e.g `FOO1=bar1\nFOO2=bar2`
- `CONFIG_LAN_$ENV_$BRANCH` and `CONFIG_DESKTOP_$ENV_$BRANCH`: `lan` and `server` configs as json string. e.g `CONFIG_LAN_DEMO_DEV`
- `PRIVATE_SSH_KEY`: SSH private key used for server deployment
- `SERVER_URL_$BRANCH`: SSH server url e.g `user@host`
- `$ENV`: represents different set of configs e.g `DEMO`, `SERVER1`, `SERVER2`
- `$BRANCH`: the branch this build process is triggered for e.g `DEV`, `MASTER`

### Dependencies
- `codeship-services.yml` codeship services definition
- `codeship-steps.yml` CI / CD steps are defined here
- `Dockerfile` and `Dockerfile.deploy` describe build environments
- `codeship.env.encrypted` encrypted ENV variables passed to docker during build process
