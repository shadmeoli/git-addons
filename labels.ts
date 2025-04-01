#!/usr/bin/env bun
import { execSync } from "child_process";
import ora from "ora";
import Table from "cli-table3";

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git lables - List Git lables from a Repository
  ===========================================
  
  A simple tool to fetch and display Git lables from a specified repository.
  
  Usage:
    git lables <repo-name>
  
  Options:
    <repo-name>      Specify the repository to fetch lables from.
    --help           Show this help message and exit.
  
  Examples:
    1. List lables from the current repository:
       git lables .
    
    2. List lables from a remote repository:
       git lables https://github.com/user/repo.git
  `);
};

// Fetch lables from the specified repository
const fetchlables = (repo: string): void => {
  try {
    const spinner = ora(`Fetching lables from ${repo}...`).start();
    const lables = execSync(`git ls-remote --lables ${repo}`)
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split("\t")[1]?.replace("refs/lables/", ""))
      .filter(Boolean);

    spinner.succeed("lables fetched successfully!");

    if (lables.length === 0) {
      console.log(`\nNo lables found in ${repo}.`);
      return;
    }
    const table = new Table({
      head: ["Tag Name"],
      style: { head: ["cyan"], border: ["gray"] },
    });
    lables.forEach((tag) => table.push([tag]));

    console.log(`\nlables in ${repo}:`);
    console.log(table.toString());
  } catch (error) {
    console.error("Error fetching lables:", (error as Error).message);
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

  const repo = args[0];
  fetchlables(repo);
};

main();
