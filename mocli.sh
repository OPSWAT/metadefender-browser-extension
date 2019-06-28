#!/usr/bin/env bash

CWD=$( cd "$( dirname "${BASH_SOURCE[0]}" )/" && pwd )
cd ${CWD}

ENVS=('local' 'dev' 'qa' 'prod')
ENV="qa"

function printHelp() {
cat << HELPDOC
     ______________________________________________
    |                         .__  .__             |
    |     _____   ____   ____ |  | |__|            |
    |    /     \ /  _ \_/ ___\|  | |  |            |
    |   |  Y Y  \| |_) )  \___|  |_|  |            |
    |   |__|_|  /|____/ \_____>____/__|            |
    |         \/  Metadefender Cloud CLI           |
    |                                              |
    |______________________________________________|

    I am your development wizard (0_0)
    Your commands are:

        developer   - Setup your developer environment
        config      - Overwrite common configuration file with specified environment
                      Usage: mocli config <local|dev|qa|prod>
        watch       - Starts a livereload server and watches all assets
        test        - Runns unit tests and generates code coverage reports
        release     - Create release versions using git-flow
                      Usage: mocli release [start|finish] <version>
        release-p   - Create release version and increases patch number
        hotfix      - Create a qa release from current branch and uploads it to bitbucket
        pack        - Zips the dist/<vendor> directory
                      Usage: mocli pack [--production] [--vendor=firefox] [--env=qa]
        help        - Show this message

HELPDOC
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
        echo "Invalid option. Opperation canceled";
        exit 1
    fi
}

function copy_secrets() {
    echo "-> copy secrets"
    aws s3 cp s3://mcl-artifacts/mcl-browser-extension/secrets.json . > /dev/null 2>&1 
    if [[ "$?" != "0" ]]; then
        echo -e "{\n\t\"googleAnalyticsId\": \"\"\n}" > ./secrets.json
        echo -e "\nFailed to copy secrets from s3. Please update ./secrets.json manually.\n"
    fi

    echo "-> copy environment specific files"
    aws s3 cp s3://mcl-artifacts/mcl-browser-extension/app/config/local.json ./app/config/ > /dev/null 2>&1 
    aws s3 cp s3://mcl-artifacts/mcl-browser-extension/app/config/dev.json ./app/config/ > /dev/null 2>&1 
    aws s3 cp s3://mcl-artifacts/mcl-browser-extension/app/config/qa.json ./app/config/ > /dev/null 2>&1 
    aws s3 cp s3://mcl-artifacts/mcl-browser-extension/app/config/prod.json ./app/config/ > /dev/null 2>&1 
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
            
            echo "-> install gulp-cli"
            npm list -g --depth=0 gulp-cli > /dev/null 2>&1 || npm i -g gulp-cli > /dev/null

            echo "-> install packages"
            npm install > /dev/null

            echo "-> copy git-flow hooks"
            cp git_hooks/* .git/hooks/

            echo "-> generate config: prod"
            gulp config --prod > /dev/null

            echo -e "-> Done\n"
            exit 0
        ;;
        config)
            TOKEN_OK=`in_array "${2}" "${ENVS[@]}"`
            if [[ ${TOKEN_OK} = 0 ]]; then
                gulp config --${2}
            else
                echo "Invalid environment token!"
                echo "Usage: mocli config <local|dev|qa|prod>"
            fi
            exit 0
        ;;
        watch)
            gulp --watch
            exit 0
        ;;
        test)
            npm run test
            exit 0
        ;;
        release)
            if [[ $# -lt 2 ]]; then
                echo "Invalid number of arguments"
                echo "Usage: mocli release <start|stop|publish> [version]"
                exit 1
            fi

            C_VERSION=`cat package.json | jq .version | sed 's/"//g'`
            VERSION=`echo ${C_VERSION} | cut -d'.' -f2`
            if [[ ${2} == "start" ]]; then
                VERSION=$((VERSION + 1))
            fi
            VERSION=`echo ${C_VERSION} | sed -r "s/.[0-9]+.[0-9]+/.${VERSION}.0/"`
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

                    gulp config --${ENV}
                    gulp pack --production --env=${ENV}
                ;;
            esac

            exit 0;
        ;;
        release-p)
            if [[ $# -lt 2 ]]; then
                echo "Invalid number of arguments"
                echo "Usage: mocli patch <start|stop|publish> [version]"
                exit 1
            fi

            C_VERSION=`cat package.json | jq .version | sed 's/"//g'`
            VERSION=`echo ${C_VERSION} | cut -d'.' -f3`
            if [[ ${2} == "start" ]]; then
                VERSION=$((VERSION + 1))
            fi
            VERSION=`echo ${C_VERSION} | sed -r "s/.[0-9]+$/.${VERSION}/"`
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

                    gulp config --${ENV}
                    gulp pack --production --env=${ENV}
                ;;
            esac
        ;;
        hotfix)
            if [[ $# -lt 2 ]]; then
                echo "Invalid number of arguments"
                echo "Usage: mocli hotfix <start|stop|publish> [version]"
            fi

            C_VERSION=`cat package.json | jq .version | sed 's/"//g'`
            VERSION=`echo ${C_VERSION} | cut -d'.' -f3`
            if [[ ${2} == "start" ]]; then
                VERSION=$((VERSION + 1))
            fi
            VERSION=`echo ${C_VERSION} | sed -r "s/.[0-9]+$/.${VERSION}/"`
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

                    gulp config --${ENV}
                    gulp pack --production --env=${ENV}
                ;;
            esac

            exit 0;
        ;;
        pack)
            CMD='gulp'
            while [[ $# -gt 0 ]]; do
                CMD="${CMD} ${1}"
                shift
            done
            ${CMD}
        ;;
        help)
            printHelp
            exit 0
        ;;
        *)
            echo "Unknown parameter: ${1}"
            printHelp
            exit 1;
        ;;
    esac
    shift
done
