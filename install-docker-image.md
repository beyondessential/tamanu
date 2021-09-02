# Intro
This is a quick guide on how to use the Dockerfile included in this repo. It requires you to install `yarn`, `git` and `node` and pre-supposes a fully operational dev environment running. For how to do this please consult the [README.md](./README.md) file in the root but read on for more details on just getting the Docker containers working.

# Pre-install
## Download Docker

Ubuntu: 
- *Note*: Install both below
- [Docker CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
- [Docker-Compose](https://docs.docker.com/compose/install/)

Mac OSX:
- [Docker for Mac](https://download.docker.com/mac/stable/Docker.dmg)

Windows:
- *Note*: If you have Hyper-V Capability, please ensure it is enabled in order to run Linux Containers on Windows. If you are running your Windows Server in cloud services, please ensure it is running on [bare-metal](https://en.wikipedia.org/wiki/Bare_machine). You will not be able to run Linux Containers in Windows if the previous comments are not adhered due to nested virtualization. 
- [Docker for Windows](https://download.docker.com/win/stable/Docker%20for%20Windows%20Installer.exe)
- *Note*: If you do not have Hyper-V capability, but your server still supports virtualization, ensure that is enabled in your BiOS, and install the following package:
- [Docker Toolbox using VirtualBox](https://github.com/docker/toolbox/releases)

Run the installation and follow the instructions.

Launch Docker. 

Performance Settings that can be changed:
Memory: 4 GiB
CPUs: 2

Once it is installed you should be able to run docker at the terminal with `docker` - this will confirm that it has been installed correctly. You may need to run the GUI first before the CLI command will work.

## Install Node and NPM
You will need to install node and npm into your environment. This is dependent on your OS. Please follow the instructions appropriate for your OS [here](https://nodejs.org/dist/latest-v12.x/).

## Install yarn
You will also need to install `yarn` the package building software. There are detailed instructions on how to do this [here for Mac](https://classic.yarnpkg.com/en/docs/install/#mac-stable) or follow the links for other OSs.

## Install git
Please follow the instructions to [install git](https://git-scm.com/downloads) into your appropriate environment.


# Begin the build process
## Clone this repo
Find an area that you would like to set this up and run `git clone https://github.com/beyondessential/tamanu-open.git`

## Install all dependent packages
Inside the newly created repo run `yarn build`. This will build all the individual workspaces within this monorepo architecture.

## Compose the Docker Image
Running `docker compose up` starts all the containers, and they're built locally so the images are available in the local docker daemon. For more details on the config please consule the included Dockerfile (see: [here](./Dockerfile)).

This will then build the docker containers.

# Connecting to the docker image
You can now using desktop client to LAN Server localhost:4000. See the [README.md](./README.md) for a link to the latest build.

# Troubleshooting
## Problem: Docker command does not work
You may need to run Docker in the GUI first. This will set up the paths for Docker and ensure paths are set up correctly.

## Problem: Rebuild Docker Containers
Instead of `docker compose` run `docker compose up --force-recreate --build`

# Support
Any issues getting this set up please email [Kurt](mailto:kurt@beyondessential.com.au)