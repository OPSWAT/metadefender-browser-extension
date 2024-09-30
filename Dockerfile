FROM node:18-slim

LABEL version="2.0"
LABEL description="Linux with node:18 and chromium browser"

RUN apt update

RUN apt-get update && apt-get install -y --no-install-recommends bash \
    python3 \
    pkg-config \
    autoconf \
    automake \
    libtool \
    nasm \
    build-essential \
    zlib1g-dev \
    chromium \
    libharfbuzz-dev \
    libnss3-dev \
    libfreetype6-dev \
    python3-pip \
    fonts-freefont-ttf \
    rm -rf /var/lib/apt/lists/*

RUN pip install awscli

RUN rm -rf /var/cache/* && mkdir /var/cache/apt

WORKDIR /opt/mo

ENV CHROMIUM_BIN=/usr/bin/chromium-browser
