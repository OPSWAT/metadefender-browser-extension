FROM node:11-alpine

LABEL version="1.0"
LABEL description="Linux alpine with node:11 and chromium browser"

RUN set -x \
    && apk update \
    && apk upgrade \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories \
    && apk add --no-cache \
        chromium@edge \
        harfbuzz@edge \
        nss@edge \
        freetype@edge \
        ttf-freefont@edge \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

WORKDIR /opt/mo

ENV CHROMIUM_BIN=/usr/bin/chromium-browser