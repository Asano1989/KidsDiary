import "@hotwired/turbo-rails"
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./react/pages/App";

let root = null;

function initializeReactApp() {
  const container = document.getElementById("root");
  
  if (container) {
    // Reactが必要なページ
    if (!root) {
      root = createRoot(container);
    }
    root.render(<App />);
  } else {
    // Railsの通常のページ
    // もし既存のReact rootがあるなら、メモリ解放のためにアンマウント
    if (root) {
      root.unmount();
      root = null;
    }
  }
}

// turbo:load はページ遷移のたびに走る
document.addEventListener('turbo:load', initializeReactApp);

// ページを離れる前にReactをクリーンアップ
document.addEventListener('turbo:before-render', () => {
  if (root) {
    root.unmount();
    root = null;
  }
});