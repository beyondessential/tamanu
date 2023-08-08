# Tamanu

> This is a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

[ ![Codeship Status for beyondessential/tamanu](https://app.codeship.com/projects/9355b080-d34d-0136-45ef-2e8db6e7ba42/status?branch=codeship)](https://app.codeship.com/projects/316346)

| Package | Runbook | Description |
| ------- | ------- | ----------- |
| [sync-server](packages/sync-server) | [sync-server runbook](https://beyond-essential.slab.com/posts/tamanu-sync-server-runbook-et0trny5) | The central server, which facility server and mobile client instances communicate with to synchronise data |
| [lan](packages/lan) | [lan runbook](https://beyond-essential.slab.com/posts/todo-tamanu-lan-runbook-ezljl0qk) | The facility server, which the app communicates with |
| [meta-server](packages/meta-server) | [meta-server runbook](https://beyond-essential.slab.com/posts/todo-tamanu-meta-server-runbook-0zbgw7m7) | The metadata server, which serves information about app versions and known sync-server installations |
| [desktop](packages/desktop) | [desktop runbook](https://beyond-essential.slab.com/posts/todo-tamanu-desktop-runbook-i2bmy57c) | The main Electron app |
| [mobile](packages/mobile) | [mobile runbook](https://beyond-essential.slab.com/posts/todo-tamanu-mobile-runbook-8vj8qceu) | The mobile app  |
| [@tamanu/shared](packages/shared) | N/A | Shared code monolith among Tamanu components |
| [@tamanu/build-tooling](packages/build-tooling) | N/A | Shared build tooling code |
| [csca](packages/csca) | [csca runbook](https://beyond-essential.slab.com/posts/csca-runbook-be1td5ml), [signer runbook](https://beyond-essential.slab.com/posts/signer-runbook-hcws6er3) | A tool to create and manage a CSCA / ICAO eMRTD PKI |

The latest version for each Tamanu service (Servers, Desktop Client & Mobile Client) can be retrieved with a HTTP GET request via their respective public API routes:

- Facility server: https://meta.tamanu.io/version/lan
- Desktop client: https://meta.tamanu.io/version/desktop
- Mobile client: https://meta.tamanu.io/version/mobile

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

Install dependencies with yarn:

```bash
$ cd tamanu
$ yarn
```

Install docker, then use it to build and run the system:

```bash
$ yarn build && docker compose up
```
```bash
$ yarn desktop-start-dev
```

You can also run `yarn sync-start-dev`, `yarn lan-start-dev`, and `yarn meta-start-dev` to run individual processes without docker. You'll need to install postgres and configure databases for lan and sync.

## Configure

<details>
<summary>Configuration overview</summary>

The modules use `config`, which helps manage different configurations easily. Each module has a
`config/` directory, with several files in it. The base configuration is in `config/default.json`,
and the values there will be used unless overridden by a more specific configuration (for eg
`config/development.json`).

The local configuration (`config/local.json`) will always take highest precedence and should not
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

Install the [PostgreSQL server](https://www.postgresql.org/download/windows/). Open pgAdmin and add a new database `tamanu-sync`

##### Linux

Install PostgreSQL from your package manager

</details>

<details>
<summary>Central server</summary>

By default, the Central server will not run migrations automatically. To enable automatic migrations, set `db.syncOnStartup` to `true` within your local configuration (see the `Config` section above).

#### Prerequisite
1. Duplicate `sync-server/config/local.example` as new file `config/local.json`.
2. Create db using `tamanu-central` or any customised name, new db can be with or without owner.
3. Store db name, root username, password or db owner credentials to `config/local.json` db config.

#### Run

```bash
yarn install
yarn workspace sync-server setup-dev # If it doesn't work, go for 'Pull data from remote'
yarn sync-start-dev
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

The Tamanu desktop app needs a Facility server running to operate correctly. For
local development, this can just be another process on the same host.

#### Prerequisite
1. Start `sync-server`
2. Duplicate `lan/config/local.example` as new file `config/local.json`.
3. Create db using `tamanu-facility` or any customised name, new db can be with or without owner.
4. Store db name, root username, password or db owner credentials to `config/local.json` db config.

#### Run

```bash
$ yarn lan-start-dev
```

This will start a build & watch process on the Facility server and the shared directory.

If you're working on backend functionality, it's much, _much_ quicker and easier to drive development
with testing. You can set up predictable test data rather than having to click through a bunch of
UI screens every time, and the live-reload turnaround is way faster than the desktop version. (this
is in addition to the fact that any backend functionality should have tests against it anyway)

The Facility server uses sequelize to manage database connections, and uses postgres exclusively.
As soon as you have postgres available, set the appropriate connection variables in your `local.json`.
</details>

<details>
<summary>Desktop app</summary>

Once there is a Facility server up and running, run this to start the Electron app for development.

```bash
$ yarn desktop-start-dev
```

Note that we also use storybook to develop components in isolation, which you can run from within
the desktop directory using `yarn storybook`.
</details>
