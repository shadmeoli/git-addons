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
LABELS_MAN="$SCRIPT_DIR/git-labels.1"
TAGS_MAN="$SCRIPT_DIR/git-tags.1"
PR_MAN="$SCRIPT_DIR/git-pr.1"
SWITCH_MAN="$SCRIPT_DIR/git-switch.1"

if [ ! -f "$WHO_MAN" ]; then
    error "git-who.1 not found. Make sure it's in the same directory as this script."
fi

if [ ! -f "$LABELS_MAN" ]; then
    error "git-labels.1 not found. Make sure it's in the same directory as this script."
fi

if [ ! -f "$TAGS_MAN" ]; then
    error "git-tags.1 not found. Make sure it's in the same directory as this script."
fi

if [ ! -f "$PR_MAN" ]; then
    error "git-pr.1 not found. Make sure it's in the same directory as this script."
fi

if [ ! -f "$SWITCH_MAN" ]; then
    error "git-switch.1 not found. Make sure it's in the same directory as this script."
fi


log "Starting installation of man pages..."

# Create Git command scripts for proper help handling
create_git_command_scripts() {
    log "Creating Git command scripts for proper help handling..."
    
    # Determine bin directory
    if [ -w "/usr/local/bin" ]; then
        BIN_DIR="/usr/local/bin"
    else
        BIN_DIR="$HOME/.local/bin"
        mkdir -p "$BIN_DIR"
        
        # Add to PATH if needed
        if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
            warn "Your PATH does not include $BIN_DIR"
            echo "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
            echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
            
            # Temporarily add to PATH
            export PATH="$BIN_DIR:$PATH"
        fi
    fi
    
    # Repository root directory for tmp path
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        REPO_ROOT=$(git rev-parse --show-toplevel)
    else
        REPO_ROOT="$SCRIPT_DIR"
    fi
    TMP_DIR="$REPO_ROOT/tmp"
    
    # Create git-who command
    cat > "$BIN_DIR/git-who" << EOL
#!/bin/bash
# Git who command
"$TMP_DIR/who" "\$@"
EOL
    chmod +x "$BIN_DIR/git-who"
    
    # Create git-labels command
    cat > "$BIN_DIR/git-labels" << EOL
#!/bin/bash
# Git labels command
"$TMP_DIR/labels" "\$@"
EOL
    chmod +x "$BIN_DIR/git-labels"
    
    # Create git-pr command
    cat > "$BIN_DIR/git-pr" << EOL
#!/bin/bash
# Git PR command
"$TMP_DIR/pr" "\$@"
EOL
    chmod +x "$BIN_DIR/git-pr"
    
    # Create git-switch command
    cat > "$BIN_DIR/git-switch" << EOL
#!/bin/bash
# Git switch command
"$TMP_DIR/switch" "\$@"
EOL
    chmod +x "$BIN_DIR/git-switch"
    
    log "Git command scripts created in $BIN_DIR"
}

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
        sudo cp "$LABELS_MAN" /usr/local/share/man/man1/
        sudo cp "$PR_MAN" /usr/local/share/man/man1/
        sudo cp "$SWITCH_MAN" /usr/local/share/man/man1/
        
        # Update man database
        if command -v mandb &> /dev/null; then
            sudo mandb
        elif command -v makewhatis &> /dev/null; then
            # For macOS and some BSD systems
            sudo makewhatis
        fi
    else
        cp "$WHO_MAN" /usr/local/share/man/man1/
        cp "$LABELS_MAN" /usr/local/share/man/man1/
        cp "$TAGS_MAN" /usr/local/share/man/man1/
        cp "$SWITCH_MAN" /usr/local/share/man/man1/
        
        # Update man database
        if command -v mandb &> /dev/null; then
            mandb
        elif command -v makewhatis &> /dev/null; then
            makewhatis
        fi
    fi
    
    log "Man pages installed globally"
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
    cp "$LABELS_MAN" "$USER_MAN_DIR/"
    cp "$SWITCH_MAN" "$USER_MAN_DIR/"
    
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
fi

# Create Git command scripts for proper help handling
read -p "Do you want to create Git command scripts for proper help handling? [Y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
    create_git_command_scripts
    log "Git command scripts created. 'git who --help' and 'git labels --help' will now work correctly."
else
    log "Skipping Git command script creation."
fi

log "Installation completed successfully!"
log "You can now use 'man git-who', 'man git-labels', 'man git-pr', or 'man git-switch'"
log "If you created Git command scripts, 'git who --help', 'git labels --help', 'git pr --help', and 'git switch --help' will also work"