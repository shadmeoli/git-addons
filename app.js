import { execSync } from 'child_process';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';

// Function to display help documentation
const displayHelp = () => {
  console.log(`
  Git Who - Custom Git Logs Tool
  ================================
  
  A simple tool to view Git logs based on the author and time range.
  
  Usage:
    git who [author_name] [--t] [--T]

  Options:
    [author_name]    Specify the author's name to view their logs (default is the current user).
    --t              Enable interactive mode to select an author from the contributors.
    --T              Enable interactive time selection (choose from options like "1 week ago", "1 month ago", etc.).
    --help           Show this help message and exit.

  Interactive Options:
    --t and --T are optional flags that can be used together to interactively select both the author and the time range.

  Examples:
    1. Default: View the logs of the current user in the last week:
       git who
       
    2. View the logs for a specific author in the last week:
       git who "Author Name"

    3. Interactive mode to select an author:
       git who --t

    4. Interactive mode to select an author and a time range:
       git who --t --T

  Time Range Options (used with --T):
    "1 day ago"
    "1 week ago"
    "2 weeks ago"
    "1 month ago"
    "3 months ago"
    "6 months ago"

  For more information, refer to the documentation or visit the Git repository.

  `);
};

// Fetch contributors from the Git history
const fetchContributors = () => {
  try {
    const contributors = execSync('git log --format="%an" | sort | uniq')
      .toString()
      .trim()
      .split('\n');

    return contributors;
  } catch (error) {
    console.error('Error fetching contributors:', error.message);
    process.exit(1);
  }
};

// Fetch logs for a specific author and time range
const fetchLogsForAuthor = (author, timeRange) => {
  try {
    const spinner = ora(`Fetching logs for ${author}...`).start();

    const logs = execSync(
      `git log --author="${author}" --since="${timeRange}" --pretty=format:"%h|%s|%ad|%an" --date=short`
    )
      .toString()
      .trim();

    spinner.succeed('Logs fetched successfully!');
    
    if (logs) {
      const table = new Table({
        head: ['Hash', 'Message', 'Date', 'Author'],
        style: {
          head: ['cyan'],
          border: ['gray'],
        },
      });

      logs.split('\n').forEach((log) => {
        const [hash, message, date, authorName] = log.split('|');
        table.push([hash, message, date, authorName]);
      });

      console.log(`\nRecent logs for ${author}:`);
      console.log(table.toString());
    } else {
      console.log(`\nNo logs found for ${author} in the past ${timeRange}.`);
    }
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    displayHelp();
    return;
  }

  const isInteractive = args.includes('--t');
  const isTimeFlag = args.includes('--T');
  
  let timeRange = '1 week ago'; // Default time range
  
  if (isTimeFlag) {
    // Prompt user for time range if --T is passed
    const { selectedTimeRange } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTimeRange',
        message: 'Select a time range for the logs:',
        choices: [
          '1 day ago',
          '1 week ago',
          '2 weeks ago',
          '1 month ago',
          '3 months ago',
          '6 months ago',
        ],
      },
    ]);
    timeRange = selectedTimeRange;
  }

  if (isInteractive) {
    const spinner = ora('Fetching contributors...').start();
    const contributors = fetchContributors();
    spinner.succeed('Contributors fetched!');

    const { selectedAuthor } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAuthor',
        message: 'Select an author to view logs for:',
        choices: contributors,
      },
    ]);

    fetchLogsForAuthor(selectedAuthor, timeRange);
  } else {
    const targetAuthor = args[0] || execSync('git config user.name').toString().trim();
    fetchLogsForAuthor(targetAuthor, timeRange);
  }
};

main();

