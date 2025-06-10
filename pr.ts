#!/usr/bin/env bun

import { exec, execSync } from "child_process";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { exitCode } from "process";
import { exitCode } from "process";

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git PR - Interactive GitHub PR Creation Tool
  ============================================

  A tool to interactively create GitHub pull requests using the GitHub CLI.

  Usage:
    git pr [--help]

  Options:
    --help           Show this help message and exit.
    --preview        Preview the command before execution.

  Requirements:
    - GitHub CLI (gh) must be installed and authenticated.
    - You must be in a Git repository connected to GitHub.

  This tool will guide you through:
    - Entering a PR title and body
    - Selecting an assignee from repository collaborators
    - Selecting labels from available repository labels
    - Optionally selecting base and head branches

  For more information, refer to the documentation.
  `);
};

// Function to check if GitHub CLI is installed and authenticated
const checkGitHubCLI = (): void => {
  try {
    // Check if gh is installed
    execSync("gh --version", { stdio: "ignore" });

    // Check if authenticated with GitHub
    execSync("gh auth status", { stdio: "ignore" });
  } catch (error) {
    console.error(
      chalk.red("Error: GitHub CLI is not installed or not authenticated.")
    );
    console.log(
      "Please install GitHub CLI and authenticate with 'gh auth login'."
    );
    process.exit(1);
  }
};

// Function to check if in a GitHub repository
const checkGitHubRepo = (): void => {
  try {
    // Check if in a git repository
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

    // Try to get the GitHub repo info
    execSync("gh repo view", { stdio: "ignore" });
  } catch (error) {
    console.error(
      chalk.red(
        "Error: Not in a GitHub repository or gh is not configured properly."
      )
    );
    process.exit(1);
  }
};

// Function to fetch repository collaborators
const fetchCollaborators = (): string[] => {
  try {
    const spinner = ora("Fetching repository collaborators...").start();

    const collaboratorsOutput = execSync(
      "gh api repos/:owner/:repo/collaborators --jq '.[].login'"
    )
      .toString()
      .trim();

    const collaborators = collaboratorsOutput
      ? collaboratorsOutput.split("\n")
      : [];

    spinner.succeed("Collaborators fetched successfully!");

    if (collaborators.length === 0) {
      console.log(chalk.yellow("No collaborators found in the repository."));
    }

    return collaborators;
  } catch (error) {
    console.error(
      chalk.red(`Error fetching collaborators: ${(error as Error).message}`)
    );
    return [];
  }
};

// Function to fetch repository labels
const fetchLabels = (): string[] => {
  try {
    const spinner = ora("Fetching repository labels...").start();

    const labelsOutput = execSync(
      "gh api repos/:owner/:repo/labels --jq '.[].name'"
    )
      .toString()
      .trim();

    const labels = labelsOutput ? labelsOutput.split("\n") : [];

    spinner.succeed("Labels fetched successfully!");

    if (labels.length === 0) {
      console.log(chalk.yellow("No labels found in the repository."));
    }

    return labels;
  } catch (error) {
    console.error(
      chalk.red(`Error fetching labels: ${(error as Error).message}`)
    );
    return [];
  }
};

// Function to fetch branches
const fetchBranches = (): string[] => {
  try {
    const branchesOutput = execSync("git branch -r")
      .toString()
      .trim()
      .split("\n")
      .map((branch) => branch.trim().replace("origin/", ""))
      .filter((branch) => branch !== "HEAD ->" && !branch.includes("->"));

    const localBranches = execSync("git branch")
      .toString()
      .trim()
      .split("\n")
      .map((branch) => branch.replace(/^\* /, "").trim())
      .filter((branch) => branch !== "HEAD ->" && !branch.includes("->"));

    return localBranches.length > branchesOutput.length
      ? localBranches
      : branchesOutput;
  } catch (error) {
    console.error(
      chalk.red(`Error fetching branches: ${(error as Error).message}`)
    );
    return [];
  }
};

// Function to get current branch name
const getCurrentBranch = (): string => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch (error) {
    console.error(
      chalk.red(`Error getting current branch: ${(error as Error).message}`)
    );
    return "";
  }
};

// Function to create a feature branch when needed
const createFeatureBranch = async (title: string): Promise<string> => {
  try {
    const spinner = ora("Creating feature branch...").start();

    // Generate a clean branch name from the PR title
    const branchName = `feature/${title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .slice(0, 50)}`; // Limit length

    // Create and checkout the new branch
    execSync(`git checkout -b ${branchName}`);

    spinner.succeed(`Feature branch created: ${branchName}`);
    return branchName;
  } catch (error) {
    throw new Error(
      `Failed to create feature branch: ${(error as Error).message}`
    );
  }
};

// Function to check if we need to create a feature branch
const needsFeatureBranch = (
  branches: string[],
  currentBranch: string
): boolean => {
  // If there's only one branch and it's main/master, we need a feature branch
  if (branches.length === 1) {
    const isMainBranch = ["main", "master"].includes(
      currentBranch.toLowerCase()
    );
    return isMainBranch;
  }

  // If current branch is main/master and user wants to create PR from it
  const isOnMainBranch = ["main", "master"].includes(
    currentBranch.toLowerCase()
  );
  return isOnMainBranch;
};

// Interface for PR creation data
interface PRData {
  title: string;
  body: string;
  assignee: string;
  labels: string[];
  baseBranch: string;
  headBranch: string;
  allBranches?: string[];
}

// Function to prompt for PR details
const promptPRDetails = async (): Promise<PRData> => {
  const collaborators = fetchCollaborators();
  const labels = fetchLabels();
  const branches = fetchBranches();
  const currentBranch = getCurrentBranch();

  // Default base branch (usually main or master)
  const defaultBaseBranch = branches.includes("main")
    ? "main"
    : branches.includes("master")
    ? "master"
    : "";

  console.log(chalk.cyan("\nCreate a new pull request\n"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Enter PR title:",
      validate: (input) => input.trim() !== "" || "Title cannot be empty",
    },
    {
      type: "input",
      name: "body",
      message: "Enter PR description: ",
      validate: (input) => input.trim() !== "",
      default: "Base changes",
    },
    {
      type: "list",
      name: "baseBranch",
      message: "Select base branch (to merge into):",
      choices: branches,
      default: defaultBaseBranch,
    },
    {
      type: "list",
      name: "headBranch",
      message: "Select head branch (your changes):",
      choices: branches,
      default: currentBranch,
    },
    {
      type: "list",
      name: "assignee",
      message: "Select an assignee:",
      choices:
        collaborators.length > 0
          ? [...collaborators, new inquirer.Separator(), "None"]
          : ["None"],
      default: collaborators[0] || "None",
    },
    {
      type: "checkbox",
      name: "labels",
      message: "Select labels for the PR:",
      choices: labels,
      when: () => labels.length > 0,
    },
  ]);

  return {
    title: answers.title,
    body: answers.body,
    assignee: answers.assignee === "None" ? "" : answers.assignee,
    labels: answers.labels || [],
    baseBranch: answers.baseBranch,
    headBranch: answers.headBranch,
    allBranches: branches,
  };
};

// Function to create the PR
const createPR = async (
  prData: PRData,
  previewMode: boolean
): Promise<void> => {
  try {
    let command = `gh pr create --title "${prData.title.replace(/"/g, '\\"')}"`;

    // Add body
    command += ` --body "${prData.body.replace(/"/g, '\\"')}"`;

    // Check if we need to create a feature branch
    const currentBranch = getCurrentBranch();
    const shouldCreateFeatureBranch = needsFeatureBranch(
      prData.allBranches || [],
      currentBranch
    );

    if (shouldCreateFeatureBranch) {
      try {
        const newFeatureBranch = await createFeatureBranch(prData.title);
        prData.headBranch = newFeatureBranch;

        console.log(
          chalk.green(
            `✓ Created and switched to feature branch: ${newFeatureBranch}`
          )
        );
        console.log(
          chalk.yellow(
            `ℹ Make your changes and commit them, then run this command again to create the PR.`
          )
        );
        return; // Exit early - user needs to make changes first
      } catch (error) {
        console.error(
          chalk.red(
            `Error creating feature branch: ${(error as Error).message}`
          )
        );
        process.exit(1);
      }
    }

    // Validate that base and head branches are different
    if (prData.baseBranch === prData.headBranch) {
      console.error(
        chalk.red("Cannot create PR: base and head branches are the same")
      );
      process.exit(1);
    }

    command += ` --base "${prData.baseBranch}"`;
    command += ` --head "${prData.headBranch}"`;

    // Add assignee if selected
    if (prData.assignee) {
      command += ` --assignee "${prData.assignee}"`;
    }

    // Add labels if selected
    if (prData.labels.length > 0) {
      command += ` --label "${prData.labels.join(",")}"`;
    }

    if (previewMode) {
      console.log(chalk.cyan("\nCommand Preview:"));
      console.log(chalk.yellow(command));

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Execute this command?",
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("PR creation cancelled."));
        return;
      }
    }

    const spinner = ora("Creating pull request...").start();

    const result = execSync(command).toString().trim();

    spinner.succeed("Pull request created successfully!");
    console.log(chalk.green(`\n${result}`));
  } catch (error) {
    console.error(chalk.red(`Error creating PR: ${(error as Error).message}`));
    process.exit(1);
  }
};

// Main function
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    displayHelp();
    return;
  }

  const previewMode = args.includes("--preview");

  // Check prerequisites
  checkGitHubCLI();
  checkGitHubRepo();

  // Prompt for PR details
  const prData = await promptPRDetails();

  // Create the PR
  await createPR(prData, previewMode);
};

main();
