# Git Tools

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

![git who screenshot](./assets/Screenshot.png)

**Features:**

- View logs for the current user (default) or a specified author
- Interactive contributor selection with `--t` flag
- Interactive time range selection with `--T` flag
- Displays commit details in a formatted table

### `git tags`

A simple tool to fetch and display Git tags from repositories.

```bash
git tags <repo-name>
```

![git tags screenshot](./assets/git-tags-screenshot.png)

**Features:**

- 🔍 List tags from the current repository or a remote repository
- 📋 Displays tags in a clean, formatted table
- 🔄 Fetches tags directly without needing to clone repositories

## 🚀 Installation

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

### `git tags`

```bash
# List tags from the current repository
git tags .

# List tags from a remote repository
git tags https://github.com/user/repo.git

# Show help
git tags --help
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
man git-tags
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
bun run dev:tags

# Build tools
bun run build
```

### Project Structure

```
.
├── install.sh            # Main installation script
├── install-man-pages.sh  # Man pages installation script
├── who.ts                # Source for git-who tool
├── tags.ts               # Source for git-tags tool
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── git-who.1             # Man page for git-who
├── git-tags.1            # Man page for git-tags
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
chmod +x tmp/who tmp/tags
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Bun](https://bun.sh/) for the amazing runtime and build tools
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts
- [cli-table3](https://github.com/cli-table/cli-table3) for formatted tables
- [ora](https://github.com/sindresorhus/ora) for elegant terminal spinners
