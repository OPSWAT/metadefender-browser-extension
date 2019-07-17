#!/usr/bin/env bash

CWD=$( cd "$( dirname "${BASH_SOURCE[0]}" )/" && pwd )
cd ${CWD}

ENVS=('local' 'dev' 'qa' 'prod')
ENV="qa"

declare -A CMDS_DESC
CMDS_DESC=(
    [developer]="Setup your developer environment"
    [config]="Overwrite common configuration file with specified environment. Usage: mocli config <local|dev|qa|prod>"
    [watch]="Starts a livereload server and watches all assets"
    [test]="Runns unit tests and generates code coverage reports"
    [release]="Create release versions using git-flow. Usage: mocli release [start|finish] <version>"
    [release-p]="Create release version and increases patch number"
    [hotfix]="Create a qa release from current branch and uploads it to bitbucket"
    [pack]="Zips the dist/<vendor> directory. Usage: mocli pack [--production] [--vendor=firefox] [--env=qa]"
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
    for i in "${!CMDS_DESC[@]}"
    do
        printf "%s %s %s \n" "$i" "${line:${#i}}" "${CMDS_DESC[$i]}"
    done
}

function gen_cmp(){
    for i in "${!CMDS_DESC[@]}"
    do
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

        _mocli" > ~/.zsh/completion/_mocli
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
}

function copy_envs() {
    echo "-> copy environment specific files"
    ENVS=(local dev qa prod)
    if [[ "${1}" != "" ]]; then
        ENVS=(${1})
    fi
    for env in ${ENVS[@]}; do
        echo s3://mcl-artifacts/mcl-browser-extension/app/config/${env}.json
        aws s3 cp s3://mcl-artifacts/mcl-browser-extension/app/config/${env}.json ./app/config/ > /dev/null 2>&1 
    done
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
            
            echo "-> install gulp-cli"
            npm list -g --depth=0 gulp-cli > /dev/null 2>&1 || npm i -g gulp-cli > /dev/null

            echo "-> install packages"
            npm install > /dev/null

            echo "-> copy git-flow hooks"
            cp git_hooks/* .git/hooks/

            echo "-> generate config: prod"
            gulp config --prod > /dev/null

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
        gen-cmp)
            gen_cmp
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
