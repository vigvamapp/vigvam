import "./styles/index.css";

import { ReactNode, StrictMode } from "react";
import { render } from "react-dom";
import { disableOutlinesForClick } from "lib/outline-on-click";

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line
  require("spacingjs/dist/bundle");
}

export function mount(app: ReactNode) {
  disableOutlinesForClick();

  render(<StrictMode>{app}</StrictMode>, document.getElementById("root"));
}
