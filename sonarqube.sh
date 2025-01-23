#!/bin/bash

SONARQUBE_URL=${SONARQUBE_URL-"https://sonar.opswat.com"}
PROJECT_VERSION=${PROJECT_VERSION-${VERSION}}
PR_ID=$1
SOURCE=$2
TARGET=$3

docker run \
    --rm \
    --add-host=sonar.opswat.com:10.192.9.121 \
    -e SONAR_HOST_URL="${SONARQUBE_URL}" \
    -e SONAR_TOKEN="${SONARQUBE_TOKEN}" \
    -v "$(pwd):/src" \
    sonarsource/sonar-scanner-cli:latest \
    -Dsonar.pullrequest.key="$PR_ID" \
    -Dsonar.pullrequest.branch="$SOURCE" \
    -Dsonar.pullrequest.base="$TARGET"
