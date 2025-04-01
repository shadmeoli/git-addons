#!/usr/bin/env bun
import { execSync } from "child_process";
import ora from "ora";
import Table from "cli-table3";

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git labels - List Git labels from a Repository
  ===========================================
  
  A simple tool to fetch and display Git labels from a specified repository.
  
  Usage:
    git labels <repo-name>
  
  Options:
    <repo-name>      Specify the repository to fetch labels from.
    --help           Show this help message and exit.
  
  Examples:
    1. List labels from the current repository:
       git labels .
    
    2. List labels from a remote repository:
       git labels https://github.com/user/repo.git
  `);
};

// Fetch labels from the specified repository
const fetchlabels = (repo: string): void => {
  try {
    const spinner = ora(`Fetching labels from ${repo}...`).start();
    const labels = execSync(`git ls-remote --labels ${repo}`)
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split("\t")[1]?.replace("refs/labels/", ""))
      .filter(Boolean);

    spinner.succeed("labels fetched successfully!");

    if (labels.length === 0) {
      console.log(`\nNo labels found in ${repo}.`);
      return;
    }
    const table = new Table({
      head: ["Tag Name"],
      style: { head: ["cyan"], border: ["gray"] },
    });
    labels.forEach((tag) => table.push([tag]));

    console.log(`\nlabels in ${repo}:`);
    console.log(table.toString());
  } catch (error) {
    console.error("Error fetching labels:", (error as Error).message);
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
  fetchlabels(repo);
};

main();
