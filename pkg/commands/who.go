package commands

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/huh/spinner"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

type UserLogItem struct {
	CommitHash    string
	CommitMessage string
	Date          string
	Author        string
}

var contributor, timeRange string

var whoCmd = &cobra.Command{
	Use:   "who",
	Short: "A simple tool to view Git logs based on the author and time range.",
	Long: `Git Who - Custom Git Logs Tool

  A simple tool to view Git logs based on the author and time range.

  Usage:
    git who [author_name] [--t] [--T]

  Options:
    [author_name]    Specify the author's name to view their logs (default is the current user).
    -t              Enable interactive mode to select an author from the contributors.
    -T              Enable interactive time selection (choose from options like "1 week ago", "1 month ago", etc.).
    -help           Show this help message and exit.

  Interactive Options:
    -t and -T are optional flags that can be used together to interactively select both the author and the time range.

  Examples:
    1. Default: Interactive menu to choose what to do:
       git who

    2. View the logs for a specific author in the last week:
       git who "Author Name"

    3. Interactive mode to select an author:
       git who -t

    4. Interactive mode to select an author and a time range:
       git who -t -T

  Time Range Options (used with --T):
    "1 day ago"
    "1 week ago"
    "2 weeks ago"
    "1 month ago"
    "3 months ago"
    "6 months ago"
`,

	Run: func(cmd *cobra.Command, args []string) {
		// var err error

		// Handle positional argument for contributor (direct author mode)
		if len(args) > 0 {
			contributor = args[0]
			// Default time range for direct mode
			if timeRange == "" {
				timeRange = "1 week ago"
			}
			// Skip interactive menu and go straight to fetching logs
			fetchAndDisplayLogs()
			return
		}

		// If flags are provided, handle them
		if cmd.Flags().Changed("contributor") || cmd.Flags().Changed("timerange") {
			handleFlagMode(cmd)
			return
		}

		// Default behavior: Show interactive menu
		showMainMenu()
	},
}

func init() {
	rootCmd.AddCommand(whoCmd)
	whoCmd.Flags().StringVarP(&contributor, "contributor", "t", "", "Select author interactively")
	whoCmd.Flags().StringVarP(&timeRange, "timerange", "T", "", "Select time range interactively")
}

func showMainMenu() {
	var choice string

	form := huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().
				Title("What would you like to do?").
				Options(
					huh.NewOption("Viewing past week commits (default)", "my_recent"),
					huh.NewOption("Select an author", "select_author"),
					huh.NewOption("Select author and time range", "select_both"),
					huh.NewOption("View all contributors", "view_contributors"),
				).
				Value(&choice),
		),
	).WithTheme(huh.ThemeCatppuccin())

	if err := form.Run(); err != nil {
		log.Error("Something went wrong with menu selection", "err", err)
		return
	}

	switch choice {
	case "my_recent":
		var err error
		contributor, err = getGitUser()
		if err != nil {
			log.Error("Unable to get git user.name", "err", err)
			return
		}
		timeRange = "1 week ago"
		fetchAndDisplayLogs()

	case "select_author":
		getContributors()
		if contributor == "" {
			return
		}
		timeRange = "1 week ago"
		fetchAndDisplayLogs()

	case "select_both":
		getContributors()
		if contributor == "" {
			return
		}
		selectTimeRange()
		if timeRange == "" {
			timeRange = "1 week ago"
		}
		fetchAndDisplayLogs()

	case "view_contributors":
		viewAllContributors()
	}
}

func handleFlagMode(cmd *cobra.Command) {
	var err error

	// If no contributor is given, fall back to git config user.name
	if contributor == "" && !cmd.Flags().Changed("contributor") {
		contributor, err = getGitUser()
		if err != nil {
			log.Error("Unable to get git user.name", "err", err)
			return
		}
	}

	// Interactive contributor selection
	if cmd.Flags().Changed("contributor") && contributor == "" {
		getContributors()
		if contributor == "" {
			log.Info("No contributor selected, exiting")
			return
		}
	}

	// Interactive time range selection
	if cmd.Flags().Changed("timerange") && timeRange == "" {
		selectTimeRange()
		if timeRange == "" {
			log.Info("No time range selected, exiting")
			return
		}
	}

	// Default time range
	if timeRange == "" {
		timeRange = "1 week ago"
	}

	fetchAndDisplayLogs()
}

func fetchAndDisplayLogs() {
	var logs []UserLogItem
	sp := spinner.New().
		Title(fmt.Sprintf("Fetching logs for %s...", contributor)).
		Action(func() {
			logs = getLogs(contributor, timeRange)
		})

	if err := sp.Run(); err != nil {
		log.Error("Something went wrong", "err", err)
		return
	}

	if len(logs) == 0 {
		fmt.Printf("No commits found for %s since %s\n", contributor, timeRange)
		return
	}

	fmt.Printf("\nCommits by %s since %s:\n\n", contributor, timeRange)
	logsTable(logs)
}

func getGitUser() (string, error) {
	out, err := exec.Command("git", "config", "user.name").Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

func getContributors() {
	__allContributors, err := exec.Command("git", "log", "--format=%an").Output()
	if err != nil {
		log.Error("Failed to get contributors", "err", err)
		return
	}

	unique := make(map[string]struct{})
	var contributorList []string

	for name := range strings.SplitSeq(string(__allContributors), "\n") {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		if _, exists := unique[name]; !exists {
			unique[name] = struct{}{}
			contributorList = append(contributorList, name)
		}
	}

	if len(contributorList) == 0 {
		log.Error("No contributors found in git history")
		return
	}

	options := make([]huh.Option[string], 0, len(contributorList))
	for _, c := range contributorList {
		options = append(options, huh.NewOption(c, c))
	}

	form := huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().
				Title("Select an author to view logs for:").
				Options(options...).
				Value(&contributor),
		),
	).WithTheme(huh.ThemeCatppuccin())

	if err := form.Run(); err != nil {
		log.Error("Something went wrong with contributor selection", "err", err)
	}
}

func selectTimeRange() {
	ranges := huh.NewOptions(
		"1 day ago",
		"1 week ago",
		"2 weeks ago",
		"1 month ago",
		"3 months ago",
		"6 months ago",
	)

	form := huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().
				Title("Select a time range for the logs:").
				Options(ranges...).
				Value(&timeRange),
		),
	).WithTheme(huh.ThemeCatppuccin())

	if err := form.Run(); err != nil {
		log.Error("Something went wrong with time range selection", "err", err)
	}
}

func viewAllContributors() {
	__allContributors, err := exec.Command("git", "log", "--format=%an").Output()
	if err != nil {
		log.Error("Failed to get contributors", "err", err)
		return
	}

	unique := make(map[string]struct{})
	var contributorList []string

	for _, name := range strings.Split(string(__allContributors), "\n") {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		if _, exists := unique[name]; !exists {
			unique[name] = struct{}{}
			contributorList = append(contributorList, name)
		}
	}

	if len(contributorList) == 0 {
		fmt.Println("No contributors found in git history")
		return
	}

	fmt.Printf("\nAll Contributors (%d):\n\n", len(contributorList))
	for i, contributor := range contributorList {
		fmt.Printf("%d. %s\n", i+1, contributor)
	}
	fmt.Println()
}

func getLogs(author string, from string) []UserLogItem {
	var userLogItems []UserLogItem
	logs, err := exec.Command(
		"git", "log",
		fmt.Sprintf("--author=%s", author),
		fmt.Sprintf("--since=%s", from),
		"--pretty=format:%h|%s|%ad|%an",
		"--date=short").
		Output()
	if err != nil {
		log.Error("Error fetching logs", "err", err)
		return userLogItems
	}

	for _, line := range strings.Split(string(logs), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) < 4 {
			continue
		}
		userLogItems = append(userLogItems, UserLogItem{
			CommitHash:    parts[0],
			CommitMessage: parts[1],
			Date:          parts[2],
			Author:        parts[3],
		})
	}
	return userLogItems
}

func logsTable(__logs []UserLogItem) {
	columns := []string{"Hash", "Message", "Date", "Author"}
	var rows [][]string
	for _, logItem := range __logs {
		rows = append(rows, []string{
			logItem.CommitHash,
			logItem.CommitMessage,
			logItem.Date,
			logItem.Author,
		})
	}

	table := table.New().
		Border(lipgloss.NormalBorder()).
		Headers(columns...).
		Rows(rows...).
		StyleFunc(func(row, col int) lipgloss.Style {
			if row == 0 {
				return lipgloss.NewStyle().
					Foreground(lipgloss.Color("36")). // cyan like cli-table3
					Bold(true)
			}
			return lipgloss.NewStyle().
				Foreground(lipgloss.Color("7")) // gray
		})

	fmt.Println(table.Render())
}
