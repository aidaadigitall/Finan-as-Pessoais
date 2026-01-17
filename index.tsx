import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

console.log("🔥 FinAI iniciado");

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#ffffff" }}>
      <App />
    </div>
  </React.StrictMode>
);

