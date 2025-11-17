# Tamanu

> This is a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

| Package | Runbook | Description |
| ------- | ------- | ----------- |
| [@tamanu/central-server](packages/central-server) | [central-server runbook](https://beyond-essential.slab.com/posts/tamanu-central-server-runbook-et0trny5) | The central server, which facility server and mobile client instances communicate with to synchronise data |
| [@tamanu/facility-server](packages/facility-server) | [facility-server runbook](https://beyond-essential.slab.com/posts/todo-tamanu-lan-runbook-ezljl0qk) | The facility server, which the app communicates with |
| [@tamanu/web-frontend](packages/web) | [web runbook](https://beyond-essential.slab.com/posts/todo-tamanu-desktop-runbook-i2bmy57c) | The web app |
| [mobile](packages/mobile) | [mobile runbook](https://beyond-essential.slab.com/posts/todo-tamanu-mobile-runbook-8vj8qceu) | The mobile app  |
| [@tamanu/shared](packages/shared) | N/A | Shared code monolith among Tamanu components |
| [@tamanu/build-tooling](packages/build-tooling) | N/A | Shared build tooling code |

## Install

First, clone the repo via git:

```bash
$ git clone git@github.com:beyondessential/tamanu.git
```

For MacBook ARM64 users, some dependencies cannot be compiled, it is recommended to switch to X86_64 for python v3. If insist, please install python v2:

```bash
$ brew install pyenv
$ pyenv install --list
$ pyenv install 2.7.18
$ pyenv versions
$ pyenv global 2.7.18

Put eval "$(pyenv init --path)" in ~/.zprofile (or ~/.bash_profile or ~/.zshrc)
```

Enable corepack (once):

```bash
$ corepack enable
```

Install dependencies with npm:

```bash
$ cd tamanu
$ npm install
```

Build all packages:

```bash
$ npm run build
```

Run the Tamanu components (in different terminals):

```bash
$ npm run central-start-dev
$ npm run facility-start-dev
$ npm run web-start-dev
```

You'll need to install postgres and configure databases for central and facility.

## Configure

<details>
<summary>Configuration overview</summary>

The modules use `config`, which helps manage different configurations easily. Each module has a
`config/` directory, with several files in it. The base configuration is in `config/default.json5`,
and the values there will be used unless overridden by a more specific configuration (for eg
`config/development.json5`).

The local configuration (`config/local.json5`) will always take highest precedence and should not
be checked into version control. This file should contain the information for database configuration,
local credentials, etc.

The [`config` docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files) have more info on how that works.
</details>

## Run

<details>
<summary>Prerequisites</summary>

#### Install postgres

##### OSX

Run:
```bash
brew install postgres
brew services start postgres
```

##### WSL

Install the [PostgreSQL server](https://www.postgresql.org/download/windows/). Open pgAdmin and add a new database `tamanu-facility`

##### Linux

Install PostgreSQL from your package manager

</details>

<details>
<summary>Central server</summary>

By default, the Central server will not run migrations automatically. To enable automatic migrations, set `db.syncOnStartup` to `true` within your local configuration (see the `Config` section above).

#### Prerequisite
1. Duplicate `central-server/config/local.example` as new file `config/local.json5`.
2. Create db using `tamanu-central` or any customised name, new db can be with or without owner.
3. Store db name, root username, password or db owner credentials to `config/local.json5` db config.

#### Run

```bash
npm install
npm run --workspace central-server setup-dev # If it doesn't work, go for 'Pull data from remote'
npm run central-start-dev
```

#### Pull data from remote
1. Ask help for pulling data from tamanu dev
2. Import data to local by running: 

```
psql -U [DB_USERNAME] -d tamanu-central < [Path to tamanu-central-dev.sql]
```

</details>

<details>
<summary>Facility server</summary>

The Tamanu web app needs a Facility server running to operate correctly. For
local development, this can just be another process on the same host.

#### Prerequisite
1. Start `central-server`
2. Duplicate `facility-server/config/local.example` as new file `config/local.json5`.
3. Create db using `tamanu-facility` or any customised name, new db can be with or without owner.
4. Store db name, root username, password or db owner credentials to `config/local.json5` db config.

#### Run

```bash
$ npm run facility-start-dev
```

This will start a build & watch process on the Facility server and the shared directory.

If you're working on backend functionality, it's much, _much_ quicker and easier to drive development
with testing. You can set up predictable test data rather than having to click through a bunch of
UI screens every time, and the live-reload turnaround is way faster than the web version. (this
is in addition to the fact that any backend functionality should have tests against it anyway)

The Facility server uses sequelize to manage database connections, and uses postgres exclusively.
As soon as you have postgres available, set the appropriate connection variables in your `local.json5`.
</details>

<details>
<summary>Web app</summary>

Once there is a Facility server up and running, run this to start the Electron app for development.

```bash
$ npm run web-start-dev
```

Note that we also use storybook to develop components in isolation, which you can run from within
the web directory using `npm run storybook`.
</details>

Temporary change
