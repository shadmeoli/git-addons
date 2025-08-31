package commands

import (
	"os"

	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "gitAddons",
	Short: "Custom 'on-top' of git commands to help streamline git processes",
	Long:  "A powerful tool to view Git logs based on author and time range with a clean, easy-to-read interface.",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		log.Error("Something went wrong initilizing the command")
		os.Exit(1)
	}
}
