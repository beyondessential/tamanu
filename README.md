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

Enable corepack (once):

```bash
$ corepack enable
```

Install dependencies with yarn:

```bash
$ cd tamanu
$ yarn
```

Build all packages:

```bash
$ yarn build
```

Run the Tamanu components (in different terminals):

```bash
$ yarn sync-start-dev
$ yarn lan-start-dev
$ yarn desktop-start-dev
```

You'll need to install postgres and configure databases for lan and sync.

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
<summary>Sync server</summary>

By default, the sync server will not run migrations automatically. To enable automatic migrations, set `db.syncOnStartup` to `true` within your local configuration (see the `Config` section above).

#### Prerequisite
1. Duplicate `sync-server/config/local.example` as new file `config/local.json`.
2. Create db using `tamanu-sync` or any customised name, new db can be with or without owner.
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
psql -U [DB_USERNAME] -d tamanu-sync < [Path to tamanu-central-dev.sql]
```

</details>

<details>
<summary>LAN server</summary>

The Tamanu desktop app needs a lan server running to operate correctly. For
local development, this can just be another process on the same host.

#### Prerequisite
1. Start `sync-server`
2. Duplicate `lan/config/local.example` as new file `config/local.json`.
3. Create db using `tamanu-lan` or any customised name, new db can be with or without owner.
4. Store db name, root username, password or db owner credentials to `config/local.json` db config.

#### Run

```bash
$ yarn lan-start-dev
```

This will start a build & watch process on the lan server and the shared directory.

If you're working on backend functionality, it's much, _much_ quicker and easier to drive development
with testing. You can set up predictable test data rather than having to click through a bunch of
UI screens every time, and the live-reload turnaround is way faster than the desktop version. (this
is in addition to the fact that any backend functionality should have tests against it anyway)

The lan server uses sequelize to manage database connections, and uses postgres exclusively.
As soons as you have postgres available, set the appropriate connection variables in your `local.json`.

When the app detects an empty or missing db on startup, it'll run an importer on an excel file to populate all the initial patients, users and reference data.

- the app will classify the db as empty if it has no users in it
- the initial definitions file to import is defined in `config.initialDataPath` (`packages/lan/data/demo_definitions.xlsx` by default)
- this is also true for production! initial production deployment expects a data definition document to be provided
</details>

<details>
<summary>Desktop app</summary>

Once there is a LAN server up and running, run this to start the Electron app for development.

```bash
$ yarn desktop-start-dev
```

Note that we also use storybook to develop components in isolation, which you can run from within
the desktop directory using `yarn storybook`.
</details>


## Integrations

<details>
<summary>Senaite (non-functional)</summary>

_NB: The Senaite integration is currently non-functional_

Senaite is disabled by default. To enable it, update your config/local.json to include the Senaite
information. The most relevant key is `enabled: true` but you'll almost certainly have to update
the API url and login credentials as well (see config/default.json for how this should be structured).
</details>

## CI / CD

> **Note: [codeship pro](https://codeship.com/features/pro) is required**

<details>
<summary>Setup</summary>

- install [Jet CLI](https://documentation.codeship.com/pro/jet-cli/installation/)
- download your codeship project's AES key from _Project Settings_
- use [SSH helper](https://github.com/codeship-library/docker-utilities/tree/master/ssh-helper) to generate SSH keys
- populate `codeship.env` with environment variables defined below
- use [jet encrypt](https://documentation.codeship.com/pro/jet-cli/encrypt/) to encrypt ENV variables e.g `jet encrypt codeship.env codeship.env.encrypted`
- make sure that `codeship.env` is kept safe or remove it
- use `jet` cli to test build pipelines e.g `jet steps --tag "dev"`
</details>

<details>
<summary>Pipeline</summary>

- `dev`, `master`, and any branch starting with `ci-` trigger build automatically
- `desktop` is built and packaged for Windows, then published to S3 by `electron-builder` (see "App updates" in the [readme of Desktop](https://github.com/beyondessential/tamanu/blob/dev/packages/desktop/README.md))
- `lan` builds are zipped and manually pushed to S3, within the `tamanu-builds` bucket
- `sync-server` and `meta-server` builds get deployed to an AWS Elastic Beanstalk cluster
</details>

<details>
<summary>Environment variables</summary>

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: AWS auth keys with S3 write access
- `CONFIG_DESKTOP`: desktop config `single lined env variables` e.g `FOO1=bar1\nFOO2=bar2`
- `CONFIG_LAN_$ENV_$BRANCH` and `CONFIG_DESKTOP_$ENV_$BRANCH`: `lan` and `server` configs as json string. e.g `CONFIG_LAN_DEMO_DEV`
- `PRIVATE_SSH_KEY`: SSH private key used for server deployment
- `SERVER_URL_$BRANCH`: SSH server url e.g `user@host`
- `$ENV`: represents different set of configs e.g `DEMO`, `SERVER1`, `SERVER2`
- `$BRANCH`: the branch this build process is triggered for e.g `DEV`, `MASTER`
</details>

<details>
<summary>Dependencies</summary>

- `codeship-services.yml` codeship services definition
- `codeship-steps.yml` CI / CD steps are defined here
- `Dockerfile` and `Dockerfile.deploy` describe build environments
- `codeship.env.encrypted` encrypted ENV variables passed to docker during build process
</details>

<details>
<summary>Server deployments</summary>

#### Setting up a new Elastic Beanstalk application and environment:

- add a certificate for a subdomain (e.g. [central-dev.tamanu.io](https://central-dev.tamanu.io)) using AWS's ACM
- configure the application and environment in AWS
  1. select "web server" when prompted
  2. fill out the basic details of your environment
     - environment and application names
     - platform (probably nodejs)
     - in the application code section choose "sample application"
  3. hit "Configure more options"
     - select an environment type of "load balancing" in the capacity section, and select a max of 1 instance if you're setting up a dev environment
     - add an https listener in the "load balancer" section, using the ACM certificate you set up earlier
       - use the certificate you created earlier
       - use default security policy (ELBSecurityPolicy-2016-08)
     - set up managed updates (this will make sure instances are kept up to date with software patches)
     - create a new database
        - we're using postgres 13.2
        - T3 micro is probably fine 
        - generate new credentials and save them in the tamanu folder in lastpass
        - set retention to "create snapshot" so that if the environment gets destroyed we have a backup
     - add the relevant keypair (tamanu-eb-key-pair, _not tamanu-key-pair_) in the security section
     - configure anything else you need (monitoring, alerts, databases, scaling, larger instances than t2.micro, etc.)
        - email notifications to team-tamanu@beyondessential.com.au
  4. create the environment (this can take a while)
  5. visit your created url to make sure everything's working ok (at this point it will still be running the AWS sample app)
  6. set up the environment variables via Configuration -> Software -> Environment properties
    - the only environment variable to set is `NODE_CONFIG`, set to a json string
    - it's easiest to copy the config from an existing environment
    - make sure to update the database connection details in that json string!
      - host from RDS "Connectivity & security" / "Endpoint & port"
      - password from earlier
      - username should just be postgres
  7. Now you'll need to create the actual database (RDS will create the cluster, not the environment)
    - set up eb ssh access to your new environment
      - (we're in ap-southeast-2 / Sydney)
    - you will need to paste in the connection string from AWS
    - use the password you made earlier
    - do everything as the postgres user
    - `CREATE DATABASE "tamanu-sync";`
  8. deploy the application version you want to the new environment
    - Applications -> Application versions
    - pick the version you want
    - deploy to your newly created environment
  9. get over into Route 53
    - use the tamanu.io hosted zone
    - create record
    - A record
    - Alias on
    - alias to EB environment, pick the appropriate zone & EB app
- add steps to [codeship-steps.yml](codeship-steps.yml):
  1. build a release version of just that package (excluding the rest of the monorepo) using [scripts/build_package_release.sh](scripts/build_package_release.sh)
  2. deploy the release using a one-line script similar to [scripts/deploy_meta_dev.sh](scripts/deploy_meta_dev.sh) or [scripts/deploy_sync_dev.sh](scripts/deploy_sync_dev.sh)
- [set up encrypted environment variables](https://docs.cloudbees.com/docs/cloudbees-codeship/latest/pro-builds-and-configuration/environment-variables#_encrypted_environment_variables) using the jet cli, and add the environmental variables used by your deploy script, then encrypt and commit the [codeship.env.encrypted](codeship.env.encrypted) file

#### Troubleshooting:

- make sure you read the logs from both Codeship and your Elastic Beanstalk environment to find out what went wrong
- configure [codeship-steps.yml](codeship-steps.yml) to build the exact branch you're working on by changing the line that looks something like `tag: ^(dev|ci-)` to `tag: ^(dev|ci-|my-branch)`
- make sure `yarn workspace my-package build` builds your package, and `yarn workspace my-package start` starts it (see [packages/sync-server/package.json](packages/sync-server/package.json) for an example)
- remember to run `chmod u+x scripts/deploy_$MYSERVICE_$MYENV.sh` so your deploy script is executable
- if your service imports dependencies it should list them as `dependencies` (not `devDependencies`) in its own `package.json`; it can find unlisted dependencies in the monorepo's root `node_modules` folder during local development, but won't be able to import them once deployed
- you can ssh into your instances by setting up the eb cli and then running `eb ssh`; this is useful for setting up a database, or for in-depth debugging
</details>

## Infrastructure

### Ansible

```shell
# Set up a lan server
ansible-playbook -i infra/ansible/hosts infra/ansible/lan.yml
```

### Terraform

Terraform can be used to create a Windows Server on AWS EC2 for LAN server deployment.

#### Prerequisites

- Install terraform on your local machine <https://www.terraform.io/downloads.html>
- Set up AWS authentication. This can be done with environment variables (by setting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) or with a credential file. See <https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html> for more information.

#### Create / manage a Windows server

- Create a new folder path `terraform/deploy/lan/<instance-name>` and file `main.tf`. See `terraform/deploy/lan/example/main.tf` for an example file to copy.
- Update the `key` attribute for s3 backend to point to the new instance name.
- Update the `instance_name` attribute of the module `lan` to use the new instance name.

- Run terraform from within that folder

    ```shell
    terraform init
    terraform plan
    terraform apply
    ```

- Once the instance is created, you can [log into the instance using SSM](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html), either via the Console or the CLI.

- If the instance needs to be re-created, do

    ```shell
    terraform destroy
    terraform apply
    ```

Terraform state is stored on S3 on the [`tamanu-terraform` bucket](https://s3.console.aws.amazon.com/s3/buckets/tamanu-terraform?region=ap-southeast-2&tab=objects).
