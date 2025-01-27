#!/bin/bash

SONARQUBE_URL=${SONARQUBE_URL-"https://sonar.opswat.com"}
PROJECT_VERSION=${PROJECT_VERSION-${VERSION}}

PR_ID=${1:-""}
SOURCE=${2:-""}
TARGET=${3:-""}

echo "Debugging parameters:"
echo "PR_ID: ${PR_ID}"
echo "SOURCE: ${SOURCE}"
echo "TARGET: ${TARGET}"

if [[ "$PR_ID" != "%teamcity.pullRequest.number%" && "$SOURCE" != "%teamcity.pullRequest.source.branch%" && "$TARGET" != "%teamcity.pullRequest.target.branch%" && -n "$PR_ID" && -n "$SOURCE" && -n "$TARGET" ]]; then
    echo "Performing pull request scan..."
    docker run \
        --rm \
        --add-host=sonar.opswat.com:10.192.9.121 \
        -e SONAR_HOST_URL="${SONARQUBE_URL}" \
        -e SONAR_TOKEN="${SONARQUBE_TOKEN}" \
        -v "$(pwd):/usr/src" \
        sonarsource/sonar-scanner-cli:latest \
        -Dsonar.pullrequest.key="$PR_ID" \
        -Dsonar.pullrequest.branch="$SOURCE" \
        -Dsonar.pullrequest.base="$TARGET"
else
    echo "Pull request parameters are invalid or not provided. Performing normal project scan..."
    docker run \
        --rm \
        --add-host=sonar.opswat.com:10.192.9.121 \
        -e SONAR_HOST_URL="${SONARQUBE_URL}" \
        -e SONAR_TOKEN="${SONARQUBE_TOKEN}" \
        -v "$(pwd):/usr/src" \
        sonarsource/sonar-scanner-cli:latest \
        -Dsonar.projectVersion="${PROJECT_VERSION}"
fi
