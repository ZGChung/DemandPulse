#!/usr/bin/env node
/**
 * DemandPulse Claude Code Plugin Installer
 *
 * This script helps install the DemandPulse plugin for Claude Code.
 * It copies the plugin directory to the appropriate location.
 */

import { existsSync, mkdirSync, cpSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine plugin installation directory
// Claude Code looks for plugins in:
// 1. ~/.config/claude-code/plugins/
// 2. ~/.claude-code/plugins/
// 3. Project-specific: ./.claude/plugins/
const possiblePluginDirs = [
  join(homedir(), ".config", "claude-code", "plugins"),
  join(homedir(), ".claude-code", "plugins"),
  join(process.cwd(), ".claude", "plugins"),
];

// Find the first existing directory, or create the first one
let targetDir = null;
for (const dir of possiblePluginDirs) {
  if (existsSync(dir)) {
    targetDir = dir;
    break;
  }
}

if (!targetDir) {
  // Create the first directory
  targetDir = possiblePluginDirs[0];
  mkdirSync(targetDir, { recursive: true });
}

const pluginName = "demandpulse";
const sourceDir = __dirname;
const destDir = join(targetDir, pluginName);

console.log(`Installing DemandPulse plugin to: ${destDir}`);

// Copy plugin files
try {
  // Remove existing plugin if it exists
  if (existsSync(destDir)) {
    console.log(`Removing existing plugin at ${destDir}`);
    // We'll use a simple approach - in production you might want to use rimraf
    // For now, we'll just inform the user
    console.log(`Please remove the existing plugin directory manually: ${destDir}`);
    console.log(`Or run: rm -rf "${destDir}"`);
    process.exit(1);
  }

  // Copy files
  cpSync(sourceDir, destDir, { recursive: true });
  console.log(`✅ Plugin installed successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Restart Claude Code`);
  console.log(
    `2. Run /demandpulse:share after a conversation about a feature, bug, or workflow pain point`
  );
  console.log(`3. Optional configuration:`);
  console.log(`   - DEMANDPULSE_ACCOUNT to link submissions to a DemandPulse account`);
  console.log(`   - DEMANDPULSE_AUTO_SUBMIT=true to enable stop-hook auto-submit`);
  console.log(`   - DEMANDPULSE_API_URL to override the default API endpoint`);
  console.log(`\nFor manual installation or troubleshooting, see README.md`);
} catch (error) {
  console.error(`❌ Installation failed: ${error.message}`);
  console.error(`\nYou can manually install the plugin by:`);
  console.error(`1. Copying the entire "${sourceDir}" directory to one of:`);
  for (const dir of possiblePluginDirs) {
    console.error(`   - ${dir}/${pluginName}`);
  }
  console.error(`2. Restarting Claude Code`);
  process.exit(1);
}
