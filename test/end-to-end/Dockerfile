FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

# Doing early `npm install` to cache those files on further image builds
COPY package*.json .npmrc adblockplus/
RUN cd adblockplus/ && npm install

ARG BROWSER=chrome

# WebdriverIO can't handle Edge installation on Debian. Running
# get-browser-binary tests as a workaround to install Edge and msedgedriver
RUN if [ "$BROWSER" = "edge" ]; then \
  git clone https://gitlab.com/eyeo/developer-experience/get-browser-binary.git; \
  cd get-browser-binary; \
  npm install; \
  npm test -- --grep "edge.*latest.*runs"; \
fi

COPY . adblockplus/
WORKDIR adblockplus/

RUN npm install
RUN cp .env.e2e.template .env.e2e
# EDGDEDRIVER_PATH is used by `local-test.conf.js`
RUN if [ "$BROWSER" = "edge" ]; then \
  echo EDGDEDRIVER_PATH=$(find / -path '*linux64*msedgedriver') >> .env.e2e; \
fi

ARG MANIFEST_VERSION=3
ARG BUILD_EXTENSION=true

RUN if [ "$BUILD_EXTENSION" = "true" ]; then \
  browserBuild=$(if [ "$BROWSER" = "edge" ]; then echo "chrome"; else echo $BROWSER; fi); \
  npm run build:release $browserBuild -- --manifest-version $MANIFEST_VERSION; \
fi

ENV SUITE=all
ENV MANIFEST_VERSION=$MANIFEST_VERSION
ENV BROWSER=$BROWSER
ENTRYPOINT npm run test:end-to-end-local $SUITE
