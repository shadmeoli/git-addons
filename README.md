# Git Tools


> [!INFO]  
> I’m currently working on **V2** of this project.  
> The new version will be written in Go to avoid having multiple binaries for each command entry.  
>  
> To access the beta versions, keep an eye on the **`V2-beta`** branch.  
>  
> If you’d like to help with the V2 porting, please create a **separate PR** for each ported command and follow the new project structure.  
>  
> With love, [Shad](https://devmeoli.top) ❤️



Custom Git tools built with TypeScript and compiled to native executables using Bun.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Built%20with-Bun-black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)

## ✨ Features

### `git who`

A powerful tool to view Git logs based on author and time range with a clean, easy-to-read interface.

```bash
git who [author_name] [--t] [--T]
```

**Features:**

- View logs for the current user (default) or a specified author
- Interactive contributor selection with `--t` flag
- Interactive time range selection with `--T` flag
- Displays commit details in a formatted table

### `git labels`

A simple tool to fetch and display Git labels from repositories.

```bash
git labels <repo-name>
```

**Features:**

- List labels from the current repository or a remote repository
- Displays labels in a clean, formatted table
- Fetches labels directly without needing to clone repositories

### `git pr`

An interactive tool for creating GitHub pull requests with ease.

```bash
git pr [--preview]
```

**Features:**

- Interactive prompts for PR title and body
- Fetches and displays repository collaborators for assignee selection
- Fetches and displays repository labels for multi-selection
- Interactive branch selection for base and head branches
- Preview mode to review the PR command before execution
- Uses the GitHub CLI (gh) for API access and PR creation

## Installation

### Prerequisites

- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (optional, recommended)
- [Bun](https://bun.sh/) (will be installed by the installer if not present)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/yourusername/git-tools.git
cd git-tools

# Run the installation script
chmod +x install.sh
./install.sh
```

The installer will:

1. Check and install GitHub CLI (if you choose to)
2. Install Bun if it's not already installed
3. Install required dependencies
4. Build the TypeScript code into native executables
5. Install the executables to the tmp directory in your repository
6. Set up Git aliases with proper help handling

## 🧰 Usage

### `git who`

```bash
# Show logs for current user in the last week
git who

# Show logs for a specific author
git who "Jane Doe"

# Interactive mode to select an author
git who --t

# Interactive mode to select both author and time range
git who --t --T

# Show help
git who --help
```

### `git labels`

```bash
# List labels from the current repository
git labels .

# List labels from a remote repository
git labels https://github.com/user/repo.git

# Show help
git labels --help
```

### `git pr`

```bash
# Create a PR with interactive prompts
git pr

# Create a PR with command preview
git pr --preview

# Show help
git pr --help
```

## 📖 Documentation

### Man Pages

For full documentation, you can install the man pages:

```bash
chmod +x install-man-pages.sh
./install-man-pages.sh
```

After installing the man pages, you can access them with:

```bash
man git-who
man git-labels
man git-pr
```

## 🛠️ Development

### Setup Development Environment

```bash
# Install dependencies
bun install
```

### Development Commands

```bash
# Run in development mode
bun run dev:who
bun run dev:labels
bun run dev:pr

# Build tools
bun run build
```

### Project Structure

```
.
├── install.sh            # Main installation script
├── install-man-pages.sh  # Man pages installation script
├── who.ts                # Source for git-who tool
├── labels.ts             # Source for git-labels tool
├── pr.ts                 # Source for git-pr tool
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── git-who.1             # Man page for git-who
├── git-labels.1          # Man page for git-labels
├── git-pr.1              # Man page for git-pr
└── tmp/                  # Directory for compiled binaries
```

## 🔄 Updating

To update to the latest version:

```bash
# Pull the latest changes
git pull

# Run the installation script again
./install.sh
```

## 🛡️ Troubleshooting

### "No manual entry for git-who"

If you encounter this issue when running `git who --help`, there are two solutions:

1. **Install the man pages** (recommended):

   ```bash
   ./install-man-pages.sh
   ```

2. **Reinstall with the latest script**:
   The latest installation script sets up aliases that handle help flags correctly.

### Permission Denied

If you get permission errors when running the tools:

```bash
chmod +x tmp/who tmp/labels tmp/pr
```

---

# Git Tag Interactive Tool

## Overview

An interactive Git tag creation tool that simplifies the process of creating and managing Git tags.

## Features

- Interactive version selection
- Automatic version suggestion
- Descriptive tag messages
- Tag creation confirmation
- Comprehensive tag display

## Requirements

- Bun runtime
- Git
- Node.js (for npm packages)

## Installation

### Quick Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-directory>

# Install dependencies
bun install

# Run installation script
chmod +x install.sh
sudo ./install.sh
```

### Manual Installation

```bash
# Install dependencies
bun install inquirer chalk ora cli-table3

# Copy script to bin directory
sudo cp tag.ts /usr/local/bin/git-tag
sudo chmod +x /usr/local/bin/git-tag

# Install man page
sudo cp git-tag.1 /usr/share/man/man1/
sudo gzip /usr/share/man/man1/git-tag.1
```

## Uninstallation

```bash
# Run uninstall script
sudo ./uninstall.sh

# Or manually remove
sudo rm /usr/local/bin/git-tag
sudo rm /usr/share/man/man1/git-tag.1.gz
```

## Usage

Simply run:

```bash
git tag
```

Follow the interactive prompts to create a new tag.

## Uninstall

> To uninstall the scripts just edit your .gitconfig file

```sh
nvim ~/.gitconfig
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feature: Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Bun](https://bun.sh/) for the amazing runtime and build tools
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts
- [cli-table3](https://github.com/cli-table/cli-table3) for formatted tables
- [ora](https://github.com/sindresorhus/ora) for elegant terminal spinners
