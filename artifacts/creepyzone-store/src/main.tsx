import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ═══════════════════════════════════════════
// IMAGE PROTECTION — GLOBAL JS
// ═══════════════════════════════════════════

// Right click — SARI images aur videos pe block
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

// Keyboard shortcuts block
document.addEventListener("keydown", (e) => {
  // PrintScreen
  if (e.key === "PrintScreen") {
    e.preventDefault();
    navigator.clipboard?.writeText("").catch(() => {});
    return false;
  }
  // Ctrl+S, Ctrl+U, Ctrl+P
  if (
    e.ctrlKey &&
    (e.key === "s" || e.key === "S" ||
     e.key === "u" || e.key === "U" ||
     e.key === "p" || e.key === "P")
  ) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+I, Ctrl+Shift+J, F12
  if (
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
    e.key === "F12"
  ) {
    e.preventDefault();
    return false;
  }
});

// Drag prevention — SARI images
document.addEventListener("dragstart", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    e.preventDefault();
    return false;
  }
});

// Selection disable — SARI images
document.addEventListener("selectstart", (e) => {
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

// Long press prevention — mobile pe image save hone se rokta hai
document.addEventListener("touchstart", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
