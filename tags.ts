#!/usr/bin/env bun

import { execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

// Function to get the latest tag
const getLatestTag = (): string | null => {
  try {
    return execSync("git describe --tags --abbrev=0").toString().trim();
  } catch {
    return null;
  }
};

// Function to suggest next version
const suggestNextVersion = (currentVersion: string | null): string => {
  if (!currentVersion) return "1.0.0";

  const versionParts = currentVersion.replace(/^v/, "").split(".").map(Number);

  // Default to incrementing patch version
  versionParts[2] = (versionParts[2] || 0) + 1;

  return versionParts.join(".");
};

// Function to validate version format
const validateVersion = (input: string): boolean => {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(input);
};

// Function to display all tags with the new tag highlighted
const displayTags = (newTag: string) => {
  try {
    const spinner = ora("Fetching tags...").start();

    // Get all tags and sort them
    const tagsOutput = execSync("git tag").toString().trim().split("\n");
    const sortedTags = tagsOutput.sort((a, b) => {
      const partsA = a.split(".").map(Number);
      const partsB = b.split(".").map(Number);

      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        if (partsA[i] !== partsB[i]) {
          return partsA[i] - partsB[i];
        }
      }
      return partsA.length - partsB.length;
    });

    spinner.stop();

    const table = new Table({
      head: ["Tags"],
      style: { head: ["cyan"] },
    });

    sortedTags.forEach((tag) => {
      if (tag === newTag) {
        table.push([chalk.green(tag)]);
      } else {
        table.push([tag]);
      }
    });

    console.log("\n" + table.toString());
  } catch (error) {
    console.error("Error fetching tags:", error);
  }
};

// Main interactive tag creation function
const createInteractiveTag = async () => {
  try {
    // Check if in a git repository
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

    // Get the latest tag
    const latestTag = getLatestTag();
    const suggestedVersion = suggestNextVersion(latestTag);

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "version",
        message: "Enter the version for the new tag:",
        default: suggestedVersion,
        validate: (input) =>
          validateVersion(input)
            ? true
            : "Please enter a valid version (x.y.z)",
      },
      {
        type: "input",
        name: "description",
        message: "Enter a description for this tag/release:",
        default: "Release version",
      },
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to create this tag?",
        default: true,
      },
    ]);

    // Confirm and create tag
    if (answers.confirm) {
      const spinner = ora("Creating tag...").start();

      // Create annotated tag
      execSync(`git tag -a v${answers.version} -m "${answers.description}"`);

      spinner.succeed(`Tag v${answers.version} created successfully!`);

      // Push tag to remote (optional, can be commented out if not desired)
      const pushSpinner = ora("Pushing tag to remote...").start();
      try {
        execSync("git push --tags");
        pushSpinner.succeed("Tag pushed to remote repository");
      } catch (pushError) {
        pushSpinner.warn(
          "Could not push tag to remote. Check your connection and permissions."
        );
      }

      // Display all tags
      displayTags(`v${answers.version}`);
    } else {
      console.log("Tag creation cancelled.");
    }
  } catch (error) {
    if ((error as Error).message.includes("not a git repository")) {
      console.error(
        chalk.red(
          "Error: Not a git repository. Please run this command in a git project."
        )
      );
    } else {
      console.error("An error occurred:", (error as Error).message);
    }
    process.exit(1);
  }
};

// Run the interactive tag creation
createInteractiveTag();
