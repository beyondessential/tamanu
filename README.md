# Tamanu

> This is a [mono-repo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

## Install

* **Note: requires a node version >= 8.3 and an ayrn version > 1.2.**

First, clone the repo via git:

```bash
$ git clone https://github.com/beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu
# Enable yarn workspaces
$ yarn config set workspaces-experimental true
$ yarn config set workspaces-nohoist-experimental true
$ yarn
$ cd ./packages/lan && yarn add json-prune
```

## Components

* [tamanu-desktop](https://github.com/beyondessential/tamanu/tree/master/packages/desktop)
* [tamanu-lan](https://github.com/beyondessential/tamanu/tree/master/packages/lan)
* [tamanu-server](https://github.com/beyondessential/tamanu/tree/master/packages/server)
* [shared-components](https://github.com/beyondessential/tamanu/tree/master/packages/shared)
