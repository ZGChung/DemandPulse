#!/usr/bin/env node
/**
 * Check GitHub Actions CI/CD status for this repo.
 * Uses GitHub API. Optional: set GITHUB_TOKEN for higher rate limits / private repos.
 * Optional: set GITHUB_REPO (e.g. ZGChung/DemandPulse); otherwise inferred from git remote origin.
 *
 * Usage: node scripts/check-ci-status.js [branch]
 *   branch defaults to "main".
 *   npm run check:ci
 */

import { execSync } from "child_process";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const DEFAULT_REPO = "ZGChung/DemandPulse";

function getRepo() {
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO;
  try {
    const url = execSync("git config --get remote.origin.url", { encoding: "utf-8" }).trim();
    const match = url.match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    return DEFAULT_REPO;
  }
  return DEFAULT_REPO;
}

async function fetchRuns(repo, branch, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `https://api.github.com/repos/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=20`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

function formatRun(run) {
  const conclusion = run.conclusion ?? run.status;
  const icon = run.conclusion === "success" ? "✅" : run.conclusion === "failure" ? "❌" : "🟡";
  const sha = (run.head_sha || "").slice(0, 7);
  const title = (run.display_title || run.name || "").slice(0, 60);
  return `${icon} #${run.run_number} ${conclusion} ${sha} ${title}`;
}

async function main() {
  const branch = process.argv[2] || "main";
  const repo = getRepo();
  const token = process.env.GITHUB_TOKEN;

  console.log(`CI/CD status for ${repo} (branch: ${branch})\n`);

  const data = await fetchRuns(repo, branch, token);
  const runs = (data.workflow_runs || []).filter((r) => r.path === CI_WORKFLOW_PATH);

  if (runs.length === 0) {
    console.log("No CI/CD pipeline runs found.");
    return;
  }

  const latest = runs[0];
  console.log("Latest run:", formatRun(latest));
  console.log("URL:", latest.html_url || `https://github.com/${repo}/actions/runs/${latest.id}`);

  if (runs.length > 1) {
    console.log("\nRecent runs:");
    runs.slice(0, 5).forEach((r) => console.log(" ", formatRun(r)));
  }

  process.exit(latest.conclusion === "failure" ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
