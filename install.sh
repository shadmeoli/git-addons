#!/bin/bash
# Installation script for the git-who tool

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

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$SCRIPT_DIR/app.js"

# Verify app.js exists
if [ ! -f "$APP_PATH" ]; then
    error "app.js not found at $APP_PATH"
fi

log "Starting installation of git-who..."

# Check and install Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log "Node.js is not installed. Installing Node.js..."
        case "$OSTYPE" in
            darwin*)
                if ! command -v brew &> /dev/null; then
                    error "Homebrew is required but not installed. Please install Homebrew first."
                fi
                brew install node
                ;;
            linux-gnu*)
                if ! command -v curl &> /dev/null; then
                    sudo apt-get update && sudo apt-get install -y curl
                fi
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            *)
                error "Unsupported operating system: $OSTYPE"
                ;;
        esac
    else
        log "Node.js is already installed: $(node --version)"
    fi
}

# Check and install Git
check_git() {
    if ! command -v git &> /dev/null; then
        log "Git is not installed. Installing Git..."
        case "$OSTYPE" in
            darwin*)
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

# Configure SSH key
setup_ssh() {
    # Prompt for SSH key path with default
    read -p "Please provide the path to your SSH key [~/.ssh/id_rsa]: " SSH_KEY_PATH
    SSH_KEY_PATH=${SSH_KEY_PATH:-"$HOME/.ssh/id_rsa"}

    # Expand tilde to home directory
    SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"

    if [ ! -f "$SSH_KEY_PATH" ]; then
        log "No SSH key found at $SSH_KEY_PATH"
        read -p "Would you like to generate a new SSH key? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
            read -p "Enter your email address: " EMAIL
            if [ -z "$EMAIL" ]; then
                error "Email address is required for SSH key generation"
            fi
            ssh-keygen -t ed25519 -C "$EMAIL" -f "$SSH_KEY_PATH"
            log "SSH key generated at $SSH_KEY_PATH"
        else
            warn "Skipping SSH key generation"
        fi
    else
        log "Using existing SSH key at $SSH_KEY_PATH"
    fi

    if [ -f "$SSH_KEY_PATH.pub" ]; then
        log "Please add the following SSH key to your GitHub account:"
        echo
        cat "$SSH_KEY_PATH.pub"
        echo
        log "Add this key at: https://github.com/settings/keys"
        read -p "Press Enter once you've added the key to GitHub..."
    fi
}

# Set up git-who command
setup_git_who() {
    log "Setting up Git alias 'who'..."
    ALIAS_COMMAND="!node \"$APP_PATH\" \"\$@\";"
    git config --global alias.who "$ALIAS_COMMAND"

    # Verify the installation
    if git config --global --get alias.who > /dev/null; then
        log "Git alias 'who' configured successfully"
    else
        error "Failed to configure git alias 'who'"
    fi
}

# Main installation process
main() {
    check_nodejs
    check_git
    setup_ssh
    setup_git_who

    log "Installation completed successfully!"
    log "You can now use 'git who' to view logs interactively"
    log "For help, run 'git who --help'"
}

# Run the installation
main
