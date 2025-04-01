#!/bin/bash
# Script to install man pages for git-who and git-labels

set -e  # Exit on error

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

# Check if man page files exist
WHO_MAN="$SCRIPT_DIR/git-who.1"
labels_MAN="$SCRIPT_DIR/git-labels.1"

if [ ! -f "$WHO_MAN" ]; then
    error "git-who.1 not found. Make sure it's in the same directory as this script."
fi

if [ ! -f "$labels_MAN" ]; then
    error "git-labels.1 not found. Make sure it's in the same directory as this script."
fi

log "Starting installation of man pages..."

# Determine installation method based on permissions
INSTALL_GLOBAL=false
if [ -w "/usr/local/share/man/man1/" ]; then
    # User has write permission to global man directory
    INSTALL_GLOBAL=true
else
    # Check if sudo is available
    if command -v sudo &> /dev/null; then
        read -p "Do you want to install man pages globally (requires sudo)? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
            INSTALL_GLOBAL=true
        fi
    else
        warn "sudo not available and no write permission to global man directory"
    fi
fi

if [ "$INSTALL_GLOBAL" = true ]; then
    # Global installation
    log "Installing man pages globally..."
    
    # Create directory if it doesn't exist
    if [ ! -d "/usr/local/share/man/man1/" ]; then
        if command -v sudo &> /dev/null; then
            sudo mkdir -p /usr/local/share/man/man1/
        else
            mkdir -p /usr/local/share/man/man1/
        fi
    fi
    
    # Copy files
    if command -v sudo &> /dev/null; then
        sudo cp "$WHO_MAN" /usr/local/share/man/man1/
        sudo cp "$labels_MAN" /usr/local/share/man/man1/
        
        # Update man database
        if command -v mandb &> /dev/null; then
            sudo mandb
        elif command -v makewhatis &> /dev/null; then
            # For macOS and some BSD systems
            sudo makewhatis
        fi
    else
        cp "$WHO_MAN" /usr/local/share/man/man1/
        cp "$labels_MAN" /usr/local/share/man/man1/
        
        # Update man database
        if command -v mandb &> /dev/null; then
            mandb
        elif command -v makewhatis &> /dev/null; then
            makewhatis
        fi
    fi
    
    log "Man pages installed globally"
    log "You can now use 'man git-who' or 'git who --help'"
else
    # Local installation to user's home directory
    log "Installing man pages locally to your home directory..."
    
    # Create local man directory if it doesn't exist
    USER_MAN_DIR="$HOME/.local/share/man/man1"
    if [ ! -d "$USER_MAN_DIR" ]; then
        mkdir -p "$USER_MAN_DIR"
    fi
    
    # Copy files
    cp "$WHO_MAN" "$USER_MAN_DIR/"
    cp "$labels_MAN" "$USER_MAN_DIR/"
    
    # Update MANPATH if needed
    if [[ ":$MANPATH:" != *":$HOME/.local/share/man:"* ]]; then
        warn "Your MANPATH does not include $HOME/.local/share/man"
        echo "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
        echo "export MANPATH=\"\$HOME/.local/share/man:\$MANPATH\""
    fi
    
    # Update man database for local installation
    if command -v mandb &> /dev/null; then
        mandb -c "$HOME/.local/share/man"
    elif command -v makewhatis &> /dev/null; then
        # For macOS and some BSD systems
        makewhatis "$HOME/.local/share/man"
    fi
    
    log "Man pages installed locally to $USER_MAN_DIR"
    log "You may need to restart your terminal or update your MANPATH"
    log "After that, you can use 'man git-who' or 'git who --help'"
fi

log "Installation completed successfully!"