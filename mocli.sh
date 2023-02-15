#!/usr/bin/env bash

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")/" && pwd)
cd ${CWD}

ENVS=('local' 'dev' 'qa' 'prod')
ENV="qa"

declare -A CMDS_DESC
CMDS_DESC=(
    [developer]="Setup your developer environment"
    [watch]="Starts a livereload server and watches all assets"
    [test]="Runns unit tests"
    [coverage]="Runns unit tests and generates code coverage reports"
    [release]="Create release versions using git-flow. Usage: mocli release [start|finish] <version>"
    [release-p]="Create release version and increases patch number"
    [hotfix]="Create a qa release from current branch and uploads it to bitbucket"
    [docs]="Create a documentation for the components"
    [pack]="Zips the dist/<vendor> directory. Usage: mocli pack [--production] [--vendor=firefox] [--env=qa]"
    [sonar-scan]="Running SonarQube Scanner from the Docker image. Usage: sonar-scan [<token>]"
    [help]="Show this message"
)

function printHelp() {
    echo " ______________________________________________  "
    echo "|                         .__  .__             | "
    echo "|     _____   ____   ____ |  | |__|            | "
    echo "|    /     \ /  _ \_/ ___\|  | |  |            | "
    echo "|   |  Y Y  \| |_) )  \___|  |_|  |            | "
    echo "|   |__|_|  /|____/ \_____>____/__|            | "
    echo "|         \/  MetaDefender Cloud CLI           | "
    echo "|                                              | "
    echo "|______________________________________________| "
    echo "                                                 "
    echo "I am your development wizard (0_0)"
    echo "Your commands are:"
    echo ""
    line="                       "
    for i in "${!CMDS_DESC[@]}"; do
        printf "%s %s %s \n" "$i" "${line:${#i}}" "${CMDS_DESC[$i]}"
    done
}

function gen_cmp() {
    for i in "${!CMDS_DESC[@]}"; do
        CMDS+=($i)
    done
    mkdir -p ~/.zsh/completion && touch ~/.zsh/completion/_mocli
    echo -e "#compdef mocli.sh
        _mocli(){
            local line

            _arguments -C \
                \"-h[Show help information]\" \
                \"--h[Show help information]\" \
                \"1: :("${CMDS[@]}")\" \
                \"*::arg:->args\"
        }

        _mocli" >~/.zsh/completion/_mocli
}

###
# Usage:    in_array $NEEDLE "${HEYSTACK[@]}"
# Returns:  0 if NEEDLE is found in HEYSTACK
###
function in_array() {
    local needle=$1
    shift
    local heystack=("$@")
    printf '%s\n' ${heystack[@]} | grep -qP "^${needle}$"
    echo $?
}

function read_env() {
    echo "Create deploy for qa | prod | dev [qa]?"
    read ENV
    if [ -z "${ENV}" ]; then
        ENV=qa
    fi
    if [ "${ENV}" != "qa" ] && [ "${ENV}" != "prod" ] && [ "${ENV}" != "dev" ]; then
        echo "Invalid option. Opperation canceled"
        exit 1
    fi
}

function copy_secrets() {
    echo "-> copy secrets"
    aws s3 cp s3://mcl-artifacts-frontend-${ENV}/mcl-browser-extension/secrets.json ./secrets.json >/dev/null 2>&1

    if [[ "$?" != "0" ]]; then
        echo -e "{\n\t\"googleAnalyticsId\": \"\"\n}" >./secrets.json
        echo -e "\nFailed to copy secrets from s3. Please update ./secrets.json manually.\n"
    fi
}

function copy_envs() {
    echo "-> copy environment specific files"
    ENVS=(local dev qa prod)
    if [[ "${1}" != "" ]]; then
        ENVS=(${1})
    fi
    for env in ${ENVS[@]}; do
        echo s3://mcl-artifacts-frontend-${ENV}/mcl-browser-extension/app/config/${env}.json
        aws s3 cp s3://mcl-artifacts-frontend-${ENV}/mcl-browser-extension/app/config/${env}.json ./config/ >/dev/null 2>&1
    done
}

function sonar_scan() {
    SONARQUBE_URL=https://sonar.opswat.com
    SONARQUBE_CACHE_DIR=${CWD}/.sonar/cache
    if [[ "${1}" != "" ]]; then
        SONARQUBE_TOKEN=${1}
    else
        echo "Please pass 'SONARQUBE_TOKEN' as an argument and run the scanner again"
        exit 1
    fi

    docker run \
        --rm \
        -e SONAR_HOST_URL="${SONARQUBE_URL}" \
        -e SONAR_LOGIN="${SONARQUBE_TOKEN}" \
        -v ${SONARQUBE_CACHE_DIR}:/opt/sonar-scanner/.sonar/cache \
        -v "${CWD}:/usr/src" \
        sonarsource/sonar-scanner-cli
}

function pack_extension() {
    webextension-toolbox build -s ./src --config ./webextension-toolbox-config.js --no-manifest-validation ${VENDOR}
}

if [[ $# == 0 ]]; then
    printHelp
    exit 0
fi

while [[ $# -gt 0 ]]; do
    case "${1}" in
    developer)
        # copy the google analytics ID. Create this file manually if you don't have access
        copy_secrets
        copy_envs

        echo "-> install webpack-cli"
        npm list -g --depth=0 webpack-cli >/dev/null 2>&1 || npm i -g webpack-cli >/dev/null

        if [[ $(npm list -g -s | grep -c webextension-toolbox) -eq 0 ]]; then
            echo "Installing webextension-toolbox globally"
            npm install -g @webextension-toolbox/webextension-toolbox
        fi

        echo "-> install packages"
        rm -rf ./node_modules/
        npm ci --legacy-peer-deps

        echo "-> copy git-flow hooks"
        cp git_hooks/* .git/hooks/

        gen_cmp

        echo -e "-> Done\n"
        exit 0
        ;;
    copy-secrets)
        copy_secrets
        exit 0
        ;;
    copy-envs)
        copy_envs ${2}
        exit 0
        ;;
    watch)
        export ENVIRONMENT=${2:-${ENV}}
        npm run start
        exit 0
        ;;
    build)
        echo "Removing dist/ folder"
        rm -rf dist

        echo "Building Chrome Extensions for ${ENVIRONMENT}"
        export ENVIRONMENT=${2:-${ENV}}
        npm run build
        exit 0
        ;;
    test)
        npm run test
        exit 0
        ;;
    coverage)
        npm run test:coverage
        exit 0
        ;;
    docs)
        if [[ $(npm list -g -s | grep -c jsdoc) -eq 0 ]]; then
            echo "Installing jsdoc globally"
            npm install -g jsdoc
        fi

        echo "Generating documentation to docs/"
        jsdoc -c jsdoc.conf.json

        exit 0
        ;;
    release)
        if [[ $# -lt 2 ]]; then
            echo "Invalid number of arguments"
            echo "Usage: mocli release <start|stop|publish> [version]"
            exit 1
        fi

        C_VERSION=$(cat package.json | jq .version | sed 's/"//g')
        VERSION=$(echo ${C_VERSION} | cut -d'.' -f2)
        if [[ ${2} == "start" ]]; then
            VERSION=$((VERSION + 1))
        fi
        VERSION=$(echo ${C_VERSION} | sed -r "s/.[0-9]+.[0-9]+/.${VERSION}.0/")
        if [[ $# = 3 ]]; then
            VERSION=${3}
        fi

        case "${2}" in
        start)
            git flow release start ${VERSION}
            git flow release publish ${VERSION}
            ;;
        finish)
            git flow release finish -Fp ${VERSION}
            git checkout customer
            ;;
        publish)
            read_env

            export ENVIRONMENT=${2:-${ENV}}
            VENDOR=${3:-'chrome'}
            pack_extension
            ;;
        esac

        exit 0
        ;;
    release-p)
        if [[ $# -lt 2 ]]; then
            echo "Invalid number of arguments"
            echo "Usage: mocli patch <start|stop|publish> [version]"
            exit 1
        fi

        C_VERSION=$(cat package.json | jq .version | sed 's/"//g')
        VERSION=$(echo ${C_VERSION} | cut -d'.' -f3)
        if [[ ${2} == "start" ]]; then
            VERSION=$((VERSION + 1))
        fi
        VERSION=$(echo ${C_VERSION} | sed -r "s/.[0-9]+$/.${VERSION}/")
        if [[ $# = 3 ]]; then
            VERSION=${3}
        fi

        case "${2}" in
        start)
            git flow release start ${VERSION}
            git flow release publish ${VERSION}
            ;;
        finish)
            git flow release finish -Fp ${VERSION}
            git checkout customer
            ;;
        publish)
            read_env

            export ENVIRONMENT=${2:-${ENV}}
            VENDOR=${3:-'chrome'}
            pack_extension
            ;;
        esac
        ;;
    hotfix)
        if [[ $# -lt 2 ]]; then
            echo "Invalid number of arguments"
            echo "Usage: mocli hotfix <start|stop|publish> [version]"
        fi

        C_VERSION=$(cat package.json | jq .version | sed 's/"//g')
        VERSION=$(echo ${C_VERSION} | cut -d'.' -f3)
        if [[ ${2} == "start" ]]; then
            VERSION=$((VERSION + 1))
        fi
        VERSION=$(echo ${C_VERSION} | sed -r "s/.[0-9]+$/.${VERSION}/")
        if [[ $# = 3 ]]; then
            VERSION=${3}
        fi

        case "${2}" in
        start)
            git flow hotfix start ${VERSION}
            git flow hotfix publish ${VERSION}
            ;;
        finish)
            git flow hotfix finish -Fp ${VERSION}
            git checkout customer
            ;;
        publish)
            read_env

            export ENVIRONMENT=${2:-${ENV}}
            VENDOR=${3:-'chrome'}
            pack_extension
            ;;
        esac

        exit 0
        ;;
    pack)
        read_env

        export ENVIRONMENT=${2:-${ENV}}
        VENDOR=${3:-'chrome'}

        pack_extension
        exit 0
        ;;
    gen-cmp)
        gen_cmp
        ;;
    sonar-scan)
        sonar_scan ${2}
        exit $?
        ;;
    help)
        printHelp
        exit 0
        ;;
    *)
        echo "Unknown parameter: ${1}"
        printHelp
        exit 1
        ;;
    esac
    shift
done
