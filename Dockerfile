FROM node:12.16-slim

LABEL version="1.4"
LABEL description="Linux with node:12 and chromium browser"

RUN apt update

RUN apt install -y bash python3 pkg-config autoconf automake libtool nasm build-essential zlib1g-dev

RUN apt install -y chromium libharfbuzz-dev libnss3-dev libfreetype6-dev ttf-freefont python-pip

RUN pip install awscli

RUN rm -rf /var/cache/* && mkdir /var/cache/apt

WORKDIR /opt/mo

ENV CHROMIUM_BIN=/usr/bin/chromium-browser