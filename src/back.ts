import browser from "webextension-polyfill";
import { openTabIfProfileChanged } from "lib/ext/profile";
import { getMainURL } from "lib/ext/utils";

import { setupFixtures } from "core/repo";
import { startServer } from "core/back/server";
import { autoUnlock } from "core/back/state";

// Auto Unlock
const PASSWORD = process.env.VIGVAM_DEV_UNLOCK_PASSWORD;

if (process.env.NODE_ENV === "development" && PASSWORD) {
  autoUnlock(PASSWORD).catch(console.warn);
}

// Setup fixtures
setupFixtures();

// Start background server
// It starts Porter server to communicate with UI & content scripts
startServer();

// Open new tab when profile changed (after reset)
openTabIfProfileChanged();

// Open new tab with extension page after install
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    browser.tabs.create({
      url: getMainURL(),
      active: true,
    });
  }

  if (reason === "install" || reason === "update") {
    browser.tabs
      .query({ url: `${process.env.VIGVAM_WEBSITE_ORIGIN}/**` })
      .then((tabs) => {
        const tabId = tabs[0]?.id;
        tabId && browser.tabs.reload(tabId);
      })
      .catch(() => undefined);
  }
});
