#!/usr/bin/env node
// localizer CLI — by Zayd @ ColdCooks
// https://github.com/zaydiscold

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const INSTALL_DIR = path.join(os.homedir(), ".localizer");
const REPO = "https://github.com/zaydiscold/localizer";

console.log("");
console.log("  localizer — timezone converter extension");
console.log("");

try {
  if (fs.existsSync(INSTALL_DIR)) {
    console.log("  updating existing install...");
    execSync("git pull --quiet", { cwd: INSTALL_DIR, stdio: "ignore" });
  } else {
    console.log("  downloading...");
    execSync(`git clone --quiet ${REPO} "${INSTALL_DIR}"`, { stdio: "ignore" });
  }

  console.log("");
  console.log(`  installed to ${INSTALL_DIR}`);
  console.log("");
  console.log("  load it in chrome:");
  console.log("    1. go to chrome://extensions");
  console.log("    2. turn on developer mode (top right)");
  console.log("    3. click 'load unpacked'");
  console.log(`    4. select ${INSTALL_DIR}`);
  console.log("");

  if (process.platform === "darwin") {
    try {
      execSync('open "chrome://extensions"', { stdio: "ignore" });
      console.log("  opened chrome://extensions for you.");
    } catch {}
  }

  console.log("  done.");
  console.log("");
} catch (err) {
  console.error("  install failed:", err.message);
  process.exit(1);
}
