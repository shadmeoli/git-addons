#!/usr/bin/env bun

import { exec, execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git Switch - Interactive Branch Switcher with Auto-rebase
  ========================================================

  An interactive tool to switch Git branches with automatic fetching and rebasing.

  Usage:
    git switch [--help] [--no-rebase] [--preview]

  Options:
    --help           Show this help message and exit.
    --no-rebase      Skip automatic rebase after switching branches.
    --preview        Preview the commands before execution.

  Features:
    - Fetches all local and remote branches
    - Interactive branch selection
    - Automatic rebase on the selected branch
    - Handles both local and remote branches
    - Creates local tracking branches for remote-only branches

  This tool will:
    1. Fetch the latest changes from all remotes
    2. Present an interactive list of all available branches
    3. Switch to the selected branch
    4. Automatically rebase the branch (unless --no-rebase is specified)

  For more information, refer to the documentation.
  `);
};

// Function to check if we're in a Git repository
const checkGitRepository = (): void => {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    console.error(chalk.red("Error: Not in a Git repository."));
    process.exit(1);
  }
};

// Function to fetch all remotes
const fetchAllRemotes = async (): Promise<void> => {
  const spinner = ora("Fetching latest changes from all remotes...").start();

  try {
    execSync("git fetch --all", { stdio: "ignore" });
    spinner.succeed("Successfully fetched from all remotes!");
  } catch (error) {
    spinner.fail("Failed to fetch from remotes");
    console.error(
      chalk.yellow(
        "Warning: Could not fetch from remotes. Proceeding with local branches only."
      )
    );
  }
};

// Interface for branch information
interface BranchInfo {
  name: string;
  displayName: string;
  isLocal: boolean;
  isRemote: boolean;
  isCurrent: boolean;
}

// Function to get all branches (local and remote)
const getAllBranches = (): BranchInfo[] => {
  try {
    const branches: BranchInfo[] = [];

    // Get local branches
    const localBranches = execSync("git branch", { encoding: "utf-8" })
      .split("\n")
      .map((branch) => branch.trim())
      .filter((branch) => branch !== "")
      .map((branch) => {
        const isCurrent = branch.startsWith("* ");
        const name = branch.replace(/^\* /, "").trim();
        return {
          name,
          displayName: isCurrent ? `${name} (current)` : name,
          isLocal: true,
          isRemote: false,
          isCurrent,
        };
      });

    branches.push(...localBranches);

    // Get remote branches
    try {
      const remoteBranches = execSync("git branch -r", { encoding: "utf-8" })
        .split("\n")
        .map((branch) => branch.trim())
        .filter((branch) => branch !== "" && !branch.includes("->"))
        .map((branch) => {
          // Remove origin/ prefix for display, but keep full name for checkout
          const fullName = branch;
          const shortName = branch.replace(/^origin\//, "");

          // Check if we already have this as a local branch
          const hasLocal = branches.some((b) => b.name === shortName);

          if (!hasLocal) {
            return {
              name: fullName,
              displayName: `${shortName} (remote)`,
              isLocal: false,
              isRemote: true,
              isCurrent: false,
            };
          }
          return null;
        })
        .filter((branch) => branch !== null) as BranchInfo[];

      branches.push(...remoteBranches);
    } catch (error) {
      console.warn(chalk.yellow("Warning: Could not fetch remote branches"));
    }

    return branches.filter((branch) => !branch.isCurrent); // Don't show current branch in selection
  } catch (error) {
    console.error(
      chalk.red(`Error fetching branches: ${(error as Error).message}`)
    );
    process.exit(1);
  }
};

// Function to switch to a branch
const switchToBranch = async (
  branch: BranchInfo,
  previewMode: boolean = false
): Promise<void> => {
  try {
    let switchCommand: string;

    if (branch.isRemote && !branch.isLocal) {
      // For remote-only branches, create a local tracking branch
      const localName = branch.name.replace(/^origin\//, "");
      switchCommand = `git checkout -b ${localName} ${branch.name}`;
    } else if (branch.isLocal) {
      // For local branches, just switch
      switchCommand = `git checkout ${branch.name}`;
    } else {
      // For remote branches that have local counterparts
      const localName = branch.name.replace(/^origin\//, "");
      switchCommand = `git checkout ${localName}`;
    }

    if (previewMode) {
      console.log(chalk.blue("Switch command:"), switchCommand);
      return;
    }

    const spinner = ora(
      `Switching to branch ${branch.name.replace(/^origin\//, "")}...`
    ).start();
    execSync(switchCommand, { stdio: "ignore" });
    spinner.succeed(
      `Successfully switched to branch ${branch.name.replace(/^origin\//, "")}`
    );
  } catch (error) {
    console.error(
      chalk.red(`Error switching to branch: ${(error as Error).message}`)
    );
    process.exit(1);
  }
};

// Function to rebase current branch
const rebaseBranch = async (previewMode: boolean = false): Promise<void> => {
  try {
    // Get current branch name
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();

    // Determine what to rebase against (usually main or master)
    let baseBranch = "main";
    try {
      execSync("git show-ref --verify --quiet refs/heads/main", {
        stdio: "ignore",
      });
    } catch {
      try {
        execSync("git show-ref --verify --quiet refs/heads/master", {
          stdio: "ignore",
        });
        baseBranch = "master";
      } catch {
        // Try to find the default branch from remote
        try {
          baseBranch = execSync("git symbolic-ref refs/remotes/origin/HEAD", {
            encoding: "utf-8",
          })
            .trim()
            .replace("refs/remotes/origin/", "");
        } catch {
          console.log(
            chalk.yellow(
              "Warning: Could not determine main branch. Skipping rebase."
            )
          );
          return;
        }
      }
    }

    // Don't rebase if we're already on the base branch
    if (currentBranch === baseBranch) {
      console.log(chalk.blue(`Already on ${baseBranch}, skipping rebase.`));
      return;
    }

    const rebaseCommand = `git rebase origin/${baseBranch}`;

    if (previewMode) {
      console.log(chalk.blue("Rebase command:"), rebaseCommand);
      return;
    }

    const spinner = ora(
      `Rebasing ${currentBranch} onto origin/${baseBranch}...`
    ).start();

    try {
      execSync(rebaseCommand, { stdio: "ignore" });
      spinner.succeed(
        `Successfully rebased ${currentBranch} onto origin/${baseBranch}`
      );
    } catch (error) {
      spinner.fail("Rebase failed");
      console.error(chalk.red("Rebase encountered conflicts or errors."));
      console.log(
        chalk.yellow(
          "You may need to resolve conflicts manually and run 'git rebase --continue'"
        )
      );

      // Show the status to help user understand what happened
      try {
        const status = execSync("git status --porcelain", {
          encoding: "utf-8",
        });
        if (status.trim()) {
          console.log(chalk.blue("\nCurrent git status:"));
          console.log(execSync("git status", { encoding: "utf-8" }));
        }
      } catch (statusError) {
        // Ignore status errors
      }
    }
  } catch (error) {
    console.error(
      chalk.red(`Error during rebase: ${(error as Error).message}`)
    );
  }
};

// Interface for branch selection
interface BranchSelection {
  selectedBranch: string;
}

// Main function
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    displayHelp();
    return;
  }

  const noRebase = args.includes("--no-rebase");
  const previewMode = args.includes("--preview");

  // Check if we're in a Git repository
  checkGitRepository();

  // Fetch latest changes from all remotes
  await fetchAllRemotes();

  // Get all available branches
  const spinner = ora("Loading available branches...").start();
  const branches = getAllBranches();
  spinner.succeed("Branches loaded!");

  if (branches.length === 0) {
    console.log(chalk.yellow("No other branches available to switch to."));
    return;
  }

  // Interactive branch selection
  const { selectedBranch } = await inquirer.prompt<BranchSelection>([
    {
      type: "list",
      name: "selectedBranch",
      message: "Select a branch to switch to:",
      choices: branches.map((branch) => ({
        name: branch.displayName,
        value: branch.name,
      })),
      pageSize: 15,
    },
  ]);

  // Find the selected branch info
  const branchInfo = branches.find((b) => b.name === selectedBranch);
  if (!branchInfo) {
    console.error(chalk.red("Error: Selected branch not found"));
    process.exit(1);
  }

  if (previewMode) {
    console.log(
      chalk.blue("\nPreview mode - commands that would be executed:")
    );
    console.log(chalk.blue("=".repeat(50)));
  }

  // Switch to the selected branch
  await switchToBranch(branchInfo, previewMode);

  // Rebase if not disabled
  if (!noRebase) {
    await rebaseBranch(previewMode);
  } else {
    console.log(chalk.blue("Skipping rebase (--no-rebase flag specified)"));
  }

  if (previewMode) {
    console.log(chalk.blue("=".repeat(50)));
    console.log(chalk.blue("End of preview"));
  } else {
    console.log(chalk.green("\n✅ Branch switch completed successfully!"));
  }
};

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error.message);
  process.exit(1);
});
