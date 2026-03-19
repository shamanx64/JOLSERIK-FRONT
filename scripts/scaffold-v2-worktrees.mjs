import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { renderLayout, renderPage } from "./render-kit-page.mjs";
import { kits } from "./worktree-kits.mjs";

const root = process.cwd();
const worktreeRoot = path.join(root, ".worktrees");
const sharedPaths = [
  "app/globals.css",
  "components.json",
  "components/ui",
  "eslint.config.mjs",
  "lib/utils.ts",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "tsconfig.json",
];

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function installDependencies(cwd) {
  if (process.platform === "win32") {
    run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm install --no-audit --no-fund"], cwd);
    return;
  }
  run("npm", ["install", "--no-audit", "--no-fund"], cwd);
}

function output(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8" }).trim();
}

function branchExists(branch) {
  return output("git", ["branch", "--list", branch]).length > 0;
}

function ensureNodeModules(worktreePath) {
  const targetPath = path.join(worktreePath, "node_modules");
  if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isSymbolicLink()) {
    fs.rmSync(targetPath, { force: true, recursive: true });
  }
  installDependencies(worktreePath);
}

function syncSharedFiles(worktreePath) {
  for (const relativePath of sharedPaths) {
    const sourcePath = path.join(root, relativePath);
    const targetPath = path.join(worktreePath, relativePath);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function ensureWorktree(kit) {
  const worktreePath = path.join(worktreeRoot, kit.slug);
  const preferredBranch = `codex/${kit.slug}`;
  const fallbackBranch = `codex/${kit.slug}-v2`;
  const branch = branchExists(preferredBranch) ? fallbackBranch : preferredBranch;

  if (!fs.existsSync(worktreeRoot)) {
    fs.mkdirSync(worktreeRoot, { recursive: true });
  }

  if (!fs.existsSync(worktreePath)) {
    if (branchExists(branch)) {
      run("git", ["worktree", "add", worktreePath, branch]);
    } else {
      run("git", ["worktree", "add", worktreePath, "-b", branch]);
    }
  }

  syncSharedFiles(worktreePath);
  ensureNodeModules(worktreePath);
  fs.writeFileSync(path.join(worktreePath, "app", "layout.tsx"), renderLayout(kit.title, kit.summary));
  fs.writeFileSync(path.join(worktreePath, "app", "page.tsx"), renderPage(kit));
}

for (const kit of kits) {
  ensureWorktree(kit);
}
