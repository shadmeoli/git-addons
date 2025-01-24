#!/usr/bin/env bun
import { execSync } from "child_process";
import ora from "ora";
import Table from "cli-table3";

// Function to display help documentation
const displayHelp = (): void => {
  console.log(`
  Git Tags - List Git Tags from a Repository
  ===========================================
  
  A simple tool to fetch and display Git tags from a specified repository.
  
  Usage:
    git tags <repo-name>
  
  Options:
    <repo-name>      Specify the repository to fetch tags from.
    --help           Show this help message and exit.
  
  Examples:
    1. List tags from the current repository:
       git tags .
    
    2. List tags from a remote repository:
       git tags https://github.com/user/repo.git
  `);
};

// Fetch tags from the specified repository
const fetchTags = (repo: string): void => {
  try {
    const spinner = ora(`Fetching tags from ${repo}...`).start();
    const tags = execSync(`git ls-remote --tags ${repo}`)
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split("\t")[1]?.replace("refs/tags/", ""))
      .filter(Boolean);

    spinner.succeed("Tags fetched successfully!");

    if (tags.length === 0) {
      console.log(`\nNo tags found in ${repo}.`);
      return;
    }
    const table = new Table({
      head: ["Tag Name"],
      style: { head: ["cyan"], border: ["gray"] },
    });
    tags.forEach((tag) => table.push([tag]));

    console.log(`\nTags in ${repo}:`);
    console.log(table.toString());
  } catch (error) {
    console.error("Error fetching tags:", (error as Error).message);
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
  fetchTags(repo);
};

main();
