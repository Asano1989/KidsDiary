import "@hotwired/turbo-rails"
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./react/pages/App";

let root = null;

function initializeReactApp() {
  const container = document.getElementById("root");
  
  if (container) {
    // すでにrootが存在する場合は、新しく作らずにrenderだけ行う
    if (!root) {
      root = createRoot(container);
    }
    root.render(<App />);
  }
}

document.addEventListener('turbo:load', initializeReactApp);