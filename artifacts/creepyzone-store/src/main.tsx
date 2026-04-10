import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ═══════════════════════════════════════════
// IMAGE PROTECTION — GLOBAL JS
// ═══════════════════════════════════════════

// Right click disable
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "IMG" ||
    target.tagName === "VIDEO" ||
    target.closest(".protected-media")
  ) {
    e.preventDefault();
    return false;
  }
});

// Keyboard shortcuts block — Ctrl+S, Ctrl+U, F12, PrintScreen
document.addEventListener("keydown", (e) => {
  // PrintScreen
  if (e.key === "PrintScreen") {
    e.preventDefault();
    navigator.clipboard?.writeText("").catch(() => {});
    return false;
  }
  // Ctrl+S (save), Ctrl+U (source), Ctrl+Shift+I (devtools), Ctrl+Shift+J
  if (
    e.ctrlKey &&
    (e.key === "s" || e.key === "S" ||
     e.key === "u" || e.key === "U" ||
     e.key === "p" || e.key === "P")
  ) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+I / Ctrl+Shift+J / F12
  if (
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
    e.key === "F12"
  ) {
    e.preventDefault();
    return false;
  }
});

// Drag prevention on images
document.addEventListener("dragstart", (e) => {
  if ((e.target as HTMLElement).tagName === "IMG") {
    e.preventDefault();
    return false;
  }
});

// Selection disable on images
document.addEventListener("selectstart", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest(".protected-media") || target.tagName === "IMG") {
    e.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
