FROM node:8
LABEL maintainer Salman Amjad

#Get required applications
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y git && apt-get install -y jq

#Create App Directory
WORKDIR /usr/src/app

#Install Dependencies
COPY package.json /usr/src/app
RUN npm install -g pm2 --loglevel silent
RUN npm install

COPY . /usr/src/app

#Setup the DB with initial user
RUN chmod +x scripts/initcouch.sh scripts/entrypoint.sh

EXPOSE 4500

RUN echo "Port 4500 exposed"
ENTRYPOINT ./scripts/entrypoint.sh
