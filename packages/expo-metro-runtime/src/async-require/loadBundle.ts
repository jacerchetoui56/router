/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { buildUrlForBundle } from "./buildUrlForBundle";
import { fetchThenEvalAsync } from "./fetchThenEval";

let pendingRequests = 0;

/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon.bundle?params=from-metro`.
 */
export function loadBundleAsync(bundlePath: string): Promise<void> {
  const requestUrl = buildUrlForBundle(bundlePath);

  if (process.env.NODE_ENV === "production") {
    return fetchThenEvalAsync(requestUrl);
  } else {
    const LoadingView =
      require("../LoadingView") as typeof import("../LoadingView").default;

    if (process.env.NODE_ENV !== "production") {
      // Send a signal to the `expo` package to show the loading indicator.
      LoadingView.showMessage("Downloading...", "load");
    }
    pendingRequests++;

    return fetchThenEvalAsync(requestUrl)
      .then(() => {
        if (process.env.NODE_ENV !== "production") {
          const HMRClient =
            require("../HMRClient") as typeof import("../HMRClient").default;
          HMRClient.registerBundle(requestUrl);
        }
      })
      .finally(() => {
        if (!--pendingRequests) {
          LoadingView.hide();
        }
      });
  }
}
