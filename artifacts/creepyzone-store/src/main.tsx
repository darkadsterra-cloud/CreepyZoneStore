import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ═══════════════════════════════════════════
// IMAGE PROTECTION — GLOBAL JS
// ═══════════════════════════════════════════

// Right click — POORE PAGE pe block
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

// Keyboard shortcuts block
document.addEventListener("keydown", (e) => {
  if (e.key === "PrintScreen") {
    e.preventDefault();
    navigator.clipboard?.writeText("").catch(() => {});
    return false;
  }
  if (
    e.ctrlKey &&
    (e.key === "s" || e.key === "S" ||
     e.key === "u" || e.key === "U" ||
     e.key === "p" || e.key === "P" ||
     e.key === "a" || e.key === "A")
  ) {
    e.preventDefault();
    return false;
  }
  if (
    (e.ctrlKey && e.shiftKey && (
      e.key === "I" || e.key === "i" ||
      e.key === "J" || e.key === "j" ||
      e.key === "C" || e.key === "c"
    )) ||
    e.key === "F12"
  ) {
    e.preventDefault();
    return false;
  }
});

// Drag prevention
document.addEventListener("dragstart", (e) => {
  e.preventDefault();
  return false;
});

// Selection disable
document.addEventListener("selectstart", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    e.preventDefault();
    return false;
  }
});

// Mobile long press save block
document.addEventListener("touchstart", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener("touchend", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG" || target.tagName === "VIDEO") {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
