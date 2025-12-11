import React from "react";
import { createRoot } from "react-dom/client";
import App from "./react/pages/App";

// 💡 認証ページをレンダリングする関数を定義
function initializeReactApp() {
  const container = document.getElementById("root");
  
  if (container) {
    createRoot(container).render(<App />);
  }
}

// 1. ページがフルロードされたとき
document.addEventListener('DOMContentLoaded', initializeReactApp);

// 2. 💡 Turboによるページ遷移が完了したとき
document.addEventListener('turbo:load', initializeReactApp);