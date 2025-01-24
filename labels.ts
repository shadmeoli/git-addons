#!/usr/bin/env bun
import { execSync } from "child_process";
import ora from "ora";
import Table from "cli-table3";

// Predefined labels for GitHub repositories
const DEFAULT_LABELS = [
  {
    color: "7057ff",
    description:
      "Changes that introduce breaking changes and would need a revisit from the frontend",
    name: "breaking changes",
  },
  {
    color: "d73a4a",
    description: "Hot fix for a bug in production",
    name: "bug fix",
  },
  {
    color: "0075ca",
    description: "Improvements or additions to documentation",
    name: "documentation",
  },
  {
    color: "cfd3d7",
    description: "This issue or pull request already exists",
    name: "duplicate",
  },
  {
    color: "a2eeef",
    description: "Subtle feature or request",
    name: "enhancement",
  },
  {
    color: "e4e669",
    description: "This doesn't seem right and will be a hotfix",
    name: "hotfix",
  },
  {
    color: "008672",
    description: "Simple and extensive updates to the internals of the server",
    name: "version update",
  },
  {
    color: "d876e3",
    description:
      "Further information is requested and update will be made to this feature",
    name: "todo",
  },
  {
    color: "A0D6D5",
    description: "This will not be worked on",
    name: "wontfix",
  },
];

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git Labels - Manage Git Labels in a Repository
  ==============================================
  
  A tool to fetch Git tags and create/manage GitHub labels in a repository.
  
  Usage:
    git labels <command> [options]
  
  Commands:
    .                 Create default labels in the current repository
    list              List existing tags in the repository
    --help            Show this help message and exit.
  
  Examples:
    1. Create default labels in the current repository:
       git labels .
    
    2. List tags in the current repository:
       git labels list
  `);
};

// Fetch labels from the specified repository (using Git tags)
const fetchLabels = (repo: string): void => {
  try {
    const spinner = ora(`Fetching labels from ${repo}...`).start();
    // Use --tags flag since we're fetching Git tags as labels
    const labels = execSync(`git ls-remote --tags ${repo}`)
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split("\t")[1]?.replace("refs/tags/", ""))
      .filter(Boolean);
    spinner.succeed("Labels fetched successfully!");
    if (labels.length === 0) {
      console.log(`\nNo labels found in ${repo}.`);
      return;
    }
    const table = new Table({
      head: ["Label Name"],
      style: { head: ["cyan"], border: ["gray"] },
    });
    labels.forEach((label) => table.push([label]));
    console.log(`\nLabels in ${repo}:`);
    console.log(table.toString());
  } catch (error) {
    console.error("Error fetching labels:", (error as Error).message);
    process.exit(1);
  }
};

// Create default labels in the current repository
const createDefaultLabels = (): void => {
  try {
    // Check if the current directory is a git repository
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

    const spinner = ora(
      "Creating default labels in the current repository..."
    ).start();

    // Get the current repository's remote URL
    const repoUrl = execSync("git config --get remote.origin.url")
      .toString()
      .trim();
    const repoOwnerAndName = repoUrl.match(
      /(?:https:\/\/github\.com\/|git@github\.com:)(.+)\.git$/
    );

    if (!repoOwnerAndName) {
      spinner.fail("Unable to determine GitHub repository details.");
      process.exit(1);
    }

    const [, repoPath] = repoOwnerAndName;

    // Create labels using GitHub CLI
    DEFAULT_LABELS.forEach((label) => {
      try {
        execSync(
          `gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --repo ${repoPath}`
        );
      } catch (labelError) {
        console.warn(
          `Warning: Could not create label "${label.name}":`,
          (labelError as Error).message
        );
      }
    });

    spinner.succeed(`Default labels created in repository: ${repoPath}`);
  } catch (error) {
    console.error("Error creating labels:", (error as Error).message);
    console.error(
      "Ensure you are in a git repository and have GitHub CLI (gh) installed."
    );
    process.exit(1);
  }
};

// Main function
const main = (): void => {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    displayHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case ".":
      createDefaultLabels();
      break;
    case "list":
      fetchLabels(".");
      break;
    default:
      fetchLabels(command);
  }
};

main();
