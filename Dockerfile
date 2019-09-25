FROM node:11-alpine

LABEL version="1.3"
LABEL description="Linux alpine with node:11 and chromium browser"

RUN set -x \
    && apk update \
    && apk upgrade \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories

RUN apk add --no-cache bash python3 pkgconfig autoconf automake libtool nasm build-base zlib-dev

RUN apk add --no-cache \
        chromium@edge \
        harfbuzz@edge \
        nss@edge \
        freetype@edge \
        ttf-freefont@edge

RUN pip3 install awscli

RUN rm -rf /var/cache/* && mkdir /var/cache/apk

WORKDIR /opt/mo

ENV CHROMIUM_BIN=/usr/bin/chromium-browser