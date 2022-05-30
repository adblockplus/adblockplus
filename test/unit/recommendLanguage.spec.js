"use strict";

const {deepEqual, equal, ok} = require("assert").strict;

const {TestEnvironment} = require("../env");

const nok = (actual, message) => equal(actual, false, message);

let env;
let visitCounter = 0;

const defaultLocale = "pl";
const defaultUrl = "https://example.com/";
const languageFile = {
  nativeNames: {
    [defaultLocale]: `[${defaultLocale}]`
  }
};
const moduleEWE = "../vendor/webext-sdk/dist/ewe-api.js";
const uiLocale = "en";

const defaultGlobals = {
  browser: {
    i18n: {
      getMessage: (name, args) => `[${name}-${args}]`,
      getUILanguage: () => uiLocale
    },
    runtime: {
      getPlatformInfo: async() => ({os: "unix"})
    },
    scripting: {
      executeScript: async() => [{result: defaultLocale}]
    },
    tabs: {
      detectLanguage: async() => defaultLocale,
      get: async() => ({url: ""})
    },
    webNavigation: {
      onCompleted: {
        addListener(listener)
        {
          listener({frameId: 0, tabId: 1, url: defaultUrl});
          listener({frameId: 0, tabId: 2, url: defaultUrl});
          listener({frameId: 0, tabId: 3, url: defaultUrl});
        }
      }
    }
  },
  async fetch()
  {
    return {
      json: async() => languageFile,
      text: async() => ""
    };
  },
  URL: class
  {
    get hostname()
    {
      return `${visitCounter++ % 5}.example.pl`;
    }
  }
};

const defaultModules = {
  [moduleEWE]: {
    notifications: {
      addNotification() {},
      showNext() {}
    },
    subscriptions: {
      getDownloadable: () => [],
      getRecommendations()
      {
        return [
          {
            languages: [defaultLocale],
            type: "ads",
            url: "http://example.com/pl.txt"
          }
        ];
      },
      has: () => false
    }
  },
  info: {application: "firefox"},
  prefs: {
    Prefs: {
      recommend_language_subscriptions: true
    }
  }
};

async function wait(ms)
{
  return new Promise((resolve) =>
  {
    setTimeout(resolve, ms);
  });
}

describe("Test language filter list recommendation", () =>
{
  beforeEach(() =>
  {
    env = new TestEnvironment({
      globals: defaultGlobals,
      modules: defaultModules
    });
  });

  afterEach(() =>
  {
    env.restore();
    env = null;
  });

  it("Should load successfully", async() =>
  {
    const loadedFiles = new Set();
    let addsListener = false;

    env.setGlobals({
      fetch(path)
      {
        loadedFiles.add(path);
        return defaultGlobals.fetch();
      }
    });

    env.override(
      env.globals.browser.webNavigation.onCompleted,
      "addListener",
      () =>
      {
        addsListener = true;
      }
    );

    env.requireModule("../../lib/recommendLanguage");
    await wait(0);

    ok(addsListener, "Navigation events listener installed");
    ok(
      loadedFiles.has("data/locales.json"),
      "Language data fetched"
    );
  });

  it("Should not load for certain languages", async() =>
  {
    const loadedFiles = new Set();
    let addsListener = false;

    env.setGlobals({
      fetch(path)
      {
        loadedFiles.add(path);
        return defaultGlobals.fetch();
      }
    });

    env.override(
      env.globals.browser.i18n,
      "getUILanguage",
      () => "de"
    );

    env.override(
      env.globals.browser.webNavigation.onCompleted,
      "addListener",
      () =>
      {
        addsListener = true;
      }
    );

    env.requireModule("../../lib/recommendLanguage");
    await wait(0);

    nok(addsListener, "Navigation events listener installed");
    nok(
      loadedFiles.has("data/locales.json"),
      "Language data fetched"
    );
  });

  it("Should not load on Opera", async() =>
  {
    const loadedFiles = new Set();
    let addsListener = false;

    env.setGlobals({
      fetch(path)
      {
        loadedFiles.add(path);
        return defaultGlobals.fetch();
      }
    });

    env.override(
      env.modules.info,
      "application",
      "opera"
    );

    env.override(
      env.globals.browser.webNavigation.onCompleted,
      "addListener",
      () =>
      {
        addsListener = true;
      }
    );

    env.requireModule("../../lib/recommendLanguage");
    await wait(0);

    nok(addsListener, "Navigation events listener installed");
    nok(
      loadedFiles.has("data/locales.json"),
      "Language data fetched"
    );
  });

  it("Should not load on Firefox Mobile", async() =>
  {
    const loadedFiles = new Set();
    let addsListener = false;

    env.setGlobals({
      fetch(path)
      {
        loadedFiles.add(path);
        return defaultGlobals.fetch();
      }
    });

    env.override(
      env.globals.browser.runtime,
      "getPlatformInfo",
      async() => ({os: "android"})
    );

    env.override(
      env.globals.browser.webNavigation.onCompleted,
      "addListener",
      () =>
      {
        addsListener = true;
      }
    );

    env.requireModule("../../lib/recommendLanguage");
    await wait(0);

    nok(addsListener, "Navigation events listener installed");
    nok(
      loadedFiles.has("data/locales.json"),
      "Language data fetched"
    );
  });

  it("Should be disabled if user opted out", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let shown = false;

      env.setModules({
        prefs: {
          Prefs: {
            recommend_language_subscriptions: false
          }
        }
      });

      env.override(
        env.modules[moduleEWE].notifications,
        "addNotification",
        () =>
        {
          shown = true;
        }
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(shown, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should show notification", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let addedNotification = null;
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "addNotification",
        (notification) =>
        {
          addedNotification = notification;
        }
      );
      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            ok(!!addedNotification, "Notification added");
            equal(
              addedNotification.id,
              "reclang-pl",
              "Notification uses appropriate ID"
            );
            equal(
              addedNotification.type,
              "information",
              "Notification uses appropriate information type"
            );
            equal(
              addedNotification.message,
              env.globals.browser.i18n.getMessage(
                "notification_recommendLanguage_message",
                [languageFile.nativeNames[defaultLocale]]
              ),
              "Notification uses appropriate translated message"
            );
            deepEqual(
              addedNotification.links,
              ["abp:subscribe:ads:pl"],
              "Notification uses appropriate subscribe link"
            );
            ok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should not show notification for other type of recommendation", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.modules[moduleEWE].subscriptions,
        "getRecommendations",
        () =>
        {
          return [
            {
              languages: [defaultLocale],
              type: "other",
              url: "http://example.com/pl.txt"
            }
          ];
        }
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should not show notification on first visit", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            nok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should not show notification if third visit has different language", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.globals.browser.tabs,
        "detectLanguage",
        async(tabId) => (tabId === 3) ? "es" : defaultLocale
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(notified, "Notification shown for different language");

            await listener({frameId: 0, tabId: 4, url: defaultUrl});
            ok(notified, "Notification shown for same language");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it(
    "Should not show notification if explicit language differs from implicit",
    () =>
    {
      return new Promise((resolve, reject) =>
      {
        let notified = false;

        env.override(
          env.modules[moduleEWE].notifications,
          "showNext",
          () =>
          {
            notified = true;
          }
        );

        env.override(
          env.globals.browser.tabs,
          "detectLanguage",
          async() => "es"
        );

        env.override(
          env.globals.browser.webNavigation.onCompleted,
          "addListener",
          async(listener) =>
          {
            try
            {
              await listener({frameId: 0, tabId: 1, url: defaultUrl});
              await listener({frameId: 0, tabId: 2, url: defaultUrl});
              await listener({frameId: 0, tabId: 3, url: defaultUrl});
              nok(notified, "Notification shown");

              resolve();
            }
            catch (ex)
            {
              reject(ex);
            }
          }
        );

        env.requireModule("../../lib/recommendLanguage");
      });
    }
  );

  it("Should not show notification for English", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.setGlobals({
        async fetch()
        {
          return {
            async json()
            {
              return {
                nativeNames: {
                  en: "[en]"
                }
              };
            },
            text: async() => ""
          };
        }
      });

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.modules[moduleEWE].subscriptions,
        "getRecommendations",
        () =>
        {
          return [
            {
              languages: ["en"],
              type: "ads",
              url: "http://example.com/en.txt"
            }
          ];
        }
      );

      env.override(
        env.globals.browser.tabs,
        "detectLanguage",
        async() => "en"
      );

      env.override(
        env.globals.browser.scripting,
        "executeScript",
        async() => [{result: "en"}]
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should not show notification for language without recommendation", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.modules[moduleEWE].subscriptions,
        "getRecommendations",
        () => []
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it("Should not show notification if filter list is already installed", () =>
  {
    return new Promise((resolve, reject) =>
    {
      let notified = false;

      env.override(
        env.modules[moduleEWE].notifications,
        "showNext",
        () =>
        {
          notified = true;
        }
      );

      env.override(
        env.modules[moduleEWE].subscriptions,
        "has",
        () => true
      );

      env.override(
        env.globals.browser.webNavigation.onCompleted,
        "addListener",
        async(listener) =>
        {
          try
          {
            await listener({frameId: 0, tabId: 1, url: defaultUrl});
            await listener({frameId: 0, tabId: 2, url: defaultUrl});
            await listener({frameId: 0, tabId: 3, url: defaultUrl});
            nok(notified, "Notification shown");

            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      );

      env.requireModule("../../lib/recommendLanguage");
    });
  });

  it(
    "Should not show notification if enough recommendations are installed",
    () =>
    {
      return new Promise((resolve, reject) =>
      {
        const recommendations = function*()
        {
          yield {
            languages: ["en"],
            type: "ads",
            url: "http://example.com/en.txt"
          };

          yield {
            languages: ["pl"],
            type: "ads",
            url: "http://example.com/pl.txt"
          };

          yield {
            languages: ["ru"],
            type: "ads",
            url: "http://example.com/ru.txt"
          };
        };

        let notified = false;

        env.override(
          env.modules[moduleEWE].notifications,
          "showNext",
          () =>
          {
            notified = true;
          }
        );

        env.override(
          env.modules[moduleEWE].subscriptions,
          "getDownloadable",
          recommendations
        );

        env.override(
          env.modules[moduleEWE].subscriptions,
          "getRecommendations",
          recommendations
        );

        env.override(
          env.globals.browser.webNavigation.onCompleted,
          "addListener",
          async(listener) =>
          {
            try
            {
              await listener({frameId: 0, tabId: 1, url: defaultUrl});
              await listener({frameId: 0, tabId: 2, url: defaultUrl});
              await listener({frameId: 0, tabId: 3, url: defaultUrl});
              nok(notified, "Notification shown");

              resolve();
            }
            catch (ex)
            {
              reject(ex);
            }
          }
        );

        env.requireModule("../../lib/recommendLanguage");
      });
    }
  );
});
