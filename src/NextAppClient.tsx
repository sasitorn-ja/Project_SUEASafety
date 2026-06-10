"use client";

import { BrowserRouter } from "./lib/router-compat";
import App from "./App";

export default function NextAppClient() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
