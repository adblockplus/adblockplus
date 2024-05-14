#! /bin/bash

set -xeu

if [[ $MANIFEST == "mv2" ]]; then
  SKIP="Subscriptions|Sitekey on MV3"
  TESTS_TO_INCLUDE=""
elif [[ $MANIFEST == "mv3" ]]; then
  SKIP="Subscriptions|Sitekey on MV2|Header"
  TESTS_TO_INCLUDE="exceptions/sitekey_mv3"
else
  echo "ERROR: MANIFEST accepted values are: \"mv2\", \"mv3\""
fi

rm -rf testpages.adblockplus.org
git clone https://gitlab.com/eyeo/developer-experience/testpages.adblockplus.org
cp $EXTENSION testpages.adblockplus.org

pushd testpages.adblockplus.org
IMAGE_NAME="${IMAGE_NAME:-compliance}"
EXTENSION_FILE="${EXTENSION##*/}" # Keep filename without folders
docker build -t $IMAGE_NAME --build-arg EXTENSION_FILE="$EXTENSION_FILE" .

TERMINAL="${TERMINAL:-it}"
BROWSER="${BROWSER:-chromium latest}"
docker run --shm-size=1g -$TERMINAL \
  -e SKIP_EXTENSION_DOWNLOAD="true"  \
  -e GREP="^.*$BROWSER((?!$SKIP).)*\$" \
  -e TESTS_TO_INCLUDE="$TESTS_TO_INCLUDE" $IMAGE_NAME
