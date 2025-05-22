#!/bin/bash
# Installation script for git-who and git-labels tools with Bun

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check for GitHub CLI (gh) at the top level
check_gh_cli() {
    log "Checking for GitHub CLI..."
    if ! command -v gh &> /dev/null; then
        warn "GitHub CLI (gh) is not installed"
        read -p "Would you like to install GitHub CLI? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
            log "Installing GitHub CLI..."
            case "$OSTYPE" in
                darwin*)
                    if command -v brew &> /dev/null; then
                        brew install gh
                    else
                        warn "Homebrew is required to install GitHub CLI on macOS"
                        warn "Please install Homebrew first from https://brew.sh"
                        read -p "Continue installation without GitHub CLI? [Y/n] " -n 1 -r
                        echo
                        if [[ ! $REPLY =~ ^[Yy]$ ]] && [ ! -z "$REPLY" ]; then
                            log "Installation aborted"
                            exit 0
                        fi
                    fi
                    ;;
                linux-gnu*)
                    # For Debian/Ubuntu
                    if command -v apt &> /dev/null; then
                        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
                        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                        sudo apt update
                        sudo apt install gh
                    # For Fedora/CentOS/RHEL
                    elif command -v dnf &> /dev/null; then
                        sudo dnf install 'dnf-command(config-manager)'
                        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
                        sudo dnf install gh
                    # For Arch Linux
                    elif command -v pacman &> /dev/null; then
                        sudo pacman -S github-cli
                    else
                        warn "Unsupported Linux distribution for automatic GitHub CLI installation"
                        warn "Please install GitHub CLI manually following instructions at: https://github.com/cli/cli#installation"
                        read -p "Continue installation without GitHub CLI? [Y/n] " -n 1 -r
                        echo
                        if [[ ! $REPLY =~ ^[Yy]$ ]] && [ ! -z "$REPLY" ]; then
                            log "Installation aborted"
                            exit 0
                        fi
                    fi
                    ;;
                *)
                    warn "Unsupported operating system for automatic GitHub CLI installation"
                    warn "Please install GitHub CLI manually following instructions at: https://github.com/cli/cli#installation"
                    read -p "Continue installation without GitHub CLI? [Y/n] " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]] && [ ! -z "$REPLY" ]; then
                        log "Installation aborted"
                        exit 0
                    fi
                    ;;
            esac
        else
            # User doesn't want to install GitHub CLI
            read -p "Continue installation without GitHub CLI? [Y/n] " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]] && [ ! -z "$REPLY" ]; then
                log "Installation aborted"
                exit 0
            fi
        fi
    else
        log "GitHub CLI is already installed: $(gh --version | head -n 1)"
    fi
}

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WHO_TS_PATH="$SCRIPT_DIR/who.ts"
LABELS_TS_PATH="$SCRIPT_DIR/labels.ts"
PR_TS_PATH="$SCRIPT_DIR/pr.ts"

# Verify scripts exist
if [ ! -f "$WHO_TS_PATH" ]; then
    error "'who.ts' script not found at $WHO_TS_PATH"
fi

if [ ! -f "$LABELS_TS_PATH" ]; then
    error "'labels.ts' script not found at $LABELS_TS_PATH"
fi

if [ ! -f "$PR_TS_PATH" ]; then
    error "'pr.ts' script not found at $PR_TS_PATH"
fi

log "Starting installation of Git tools..."

# Check and install Bun
check_bun() {
    if ! command -v bun &> /dev/null; then
        log "Bun is not installed. Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        
        # Source the updated profile to make bun available
        if [ -f "$HOME/.bashrc" ]; then
            source "$HOME/.bashrc"
        elif [ -f "$HOME/.zshrc" ]; then
            source "$HOME/.zshrc"
        fi
        
        # Check again if bun is available
        if ! command -v bun &> /dev/null; then
            export PATH="$HOME/.bun/bin:$PATH"
        fi
        
        if ! command -v bun &> /dev/null; then
            warn "Bun was installed but is not available in the current shell"
            warn "Please open a new terminal or run: export PATH=\"\$HOME/.bun/bin:\$PATH\""
            read -p "Press Enter to continue..."
        else
            log "Bun is now installed: $(bun --version)"
        fi
    else
        log "Bun is already installed: $(bun --version)"
    fi
}

# Check and install Git
check_git() {
    if ! command -v git &> /dev/null; then
        log "Git is not installed. Installing Git..."
        case "$OSTYPE" in
            darwin*)
                if ! command -v brew &> /dev/null; then
                    error "Homebrew is required but not installed. Please install Homebrew first."
                fi
                brew install git
                ;;
            linux-gnu*)
                sudo apt-get update
                sudo apt-get install -y git
                ;;
            *)
                error "Unsupported operating system: $OSTYPE"
                ;;
        esac
    else
        log "Git is already installed: $(git --version)"
    fi
}

# Install npm dependencies
install_dependencies() {
    log "Installing required dependencies using Bun..."
    
    # Verify package.json exists
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        error "package.json not found. Make sure it's in the same directory as the install script."
    fi
    
    # Install dependencies
    cd "$SCRIPT_DIR"
    bun install
    
    # Check if installation was successful
    if [ $? -eq 0 ]; then
        log "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
    fi
}

# Build the TypeScript files into native executables
build_executables() {
    log "Building native executables with Bun..."
    cd "$SCRIPT_DIR"
    bun run build
    
    # Check if build was successful
    if [ $? -eq 0 ] && [ -f "$SCRIPT_DIR/who" ] && [ -f "$SCRIPT_DIR/labels" ] && [ -f "$SCRIPT_DIR/pr" ]; then
        log "Executables built successfully"
    else
        error "Failed to build executables"
    fi
}

# Install executables to project's tmp directory
install_executables() {
    log "Installing executables to project's tmp directory..."

    # TMP_DIR is already set in the main function based on repo root
    if [ ! -d "$TMP_DIR" ]; then
        mkdir -p "$TMP_DIR"
        log "Created tmp directory at $TMP_DIR"
    fi
    
    # Copy executables
    cp "$SCRIPT_DIR/who" "$TMP_DIR/who"
    cp "$SCRIPT_DIR/labels" "$TMP_DIR/labels"
    cp "$SCRIPT_DIR/pr" "$TMP_DIR/pr"
    
    # Make them executable
    chmod +x "$TMP_DIR/who"
    chmod +x "$TMP_DIR/labels"
    chmod +x "$TMP_DIR/pr"
    
    log "Executables installed successfully to $TMP_DIR"
    
    # Provide instructions for adding to PATH temporarily
    echo ""
    echo "To use these commands from anywhere, you can temporarily add the tmp directory to your PATH:"
    echo ""
    echo "  export PATH=\"$TMP_DIR:\$PATH\""
    echo ""
    echo "Or you can run them directly using:"
    echo ""
    echo "  $TMP_DIR/who"
    echo "  $TMP_DIR/labels"
    echo "  $TMP_DIR/pr"
    echo ""
}

# Create a wrapper script for better help handling
create_wrapper_scripts() {
    log "Creating wrapper scripts for better help handling..."
    
    # Create wrapper directory if it doesn't exist
    WRAPPER_DIR="$TMP_DIR/wrappers"
    if [ ! -d "$WRAPPER_DIR" ]; then
        mkdir -p "$WRAPPER_DIR"
    fi
    
    # Create wrapper for who
    cat > "$WRAPPER_DIR/git-who-wrapper.sh" << EOL
#!/bin/bash
if [ "\$1" = "--help" ] || [ "\$1" = "-h" ]; then
  "$TMP_DIR/who" --help
else
  "$TMP_DIR/who" "\$@"
fi
EOL
    chmod +x "$WRAPPER_DIR/git-who-wrapper.sh"
    
    # Create wrapper for labels
    cat > "$WRAPPER_DIR/git-labels-wrapper.sh" << EOL
#!/bin/bash
if [ "\$1" = "--help" ] || [ "\$1" = "-h" ]; then
  "$TMP_DIR/labels" --help
else
  "$TMP_DIR/labels" "\$@"
fi
EOL
    chmod +x "$WRAPPER_DIR/git-labels-wrapper.sh"
    
    # Create wrapper for pr
    cat > "$WRAPPER_DIR/git-pr-wrapper.sh" << EOL
#!/bin/bash
if [ "\$1" = "--help" ] || [ "\$1" = "-h" ]; then
  "$TMP_DIR/pr" --help
else
  "$TMP_DIR/pr" "\$@"
fi
EOL
    chmod +x "$WRAPPER_DIR/git-pr-wrapper.sh"
    
    log "Wrapper scripts created successfully"
}

# Setup Git aliases
setup_git_aliases() {
    log "Setting up Git aliases..."
    
    # First create wrapper scripts for better help handling
    create_wrapper_scripts
    
    # Get paths to wrapper scripts
    WHO_WRAPPER="$WRAPPER_DIR/git-who-wrapper.sh"
    LABELS_WRAPPER="$WRAPPER_DIR/git-labels-wrapper.sh"
    PR_WRAPPER="$WRAPPER_DIR/git-pr-wrapper.sh"
    
    # Configure Git aliases with wrapper scripts
    git config --global alias.who "!\"$WHO_WRAPPER\""
    git config --global alias.labels "!\"$LABELS_WRAPPER\""
    git config --global alias.pr "!\"$PR_WRAPPER\""
    
    # Verify the aliases were set up correctly
    if git config --global --get alias.who > /dev/null && git config --global --get alias.labels > /dev/null && git config --global --get alias.pr > /dev/null; then
        log "Git aliases configured successfully"
        
        # Show what was added to .gitconfig
        log "The following has been added to your .gitconfig file:"
        echo "[alias]"
        echo "    who = !\"$WHO_WRAPPER\""
        echo "    labels = !\"$LABELS_WRAPPER\""
        echo "    pr = !\"$PR_WRAPPER\""
    else
        error "Failed to configure Git aliases"
    fi
    
    log "You can now use 'git who', 'git labels', and 'git pr' commands"
}

# Main installation process
main() {
    # First check for GitHub CLI
    check_gh_cli
    
    # Determine repository root directory (for Git)
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        REPO_ROOT=$(git rev-parse --show-toplevel)
        log "Git repository detected at: $REPO_ROOT"
        
        # If script is not in the repo root, adjust paths accordingly
        if [ "$SCRIPT_DIR" != "$REPO_ROOT" ]; then
            log "Script is running from a subdirectory of the repository"
            # Keep SCRIPT_DIR as-is for script location
        fi
    else
        # Not in a git repository, use script directory
        REPO_ROOT="$SCRIPT_DIR"
        log "Not in a Git repository, using script directory as root"
    fi

    # Use REPO_ROOT to define TMP_DIR
    TMP_DIR="$REPO_ROOT/tmp"
    
    check_bun
    check_git
    install_dependencies
    build_executables
    install_executables
    setup_git_aliases

    # cleanup bun build binary logs
    find . -name "*.bun-build" -type f -delete

    log "Installation completed successfully!"
    log "You can now use 'git who', 'git labels', and 'git pr' commands"
    log "For help, run 'git who --help', 'git labels --help', or 'git pr --help'"
}

# Run the installation
main