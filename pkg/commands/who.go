package commands

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

type UserLogItem struct {
	CommitHash    string
	Origin        *string
	CommitMessage string
}

var contributor, timeRange string
var contributors []huh.Option[string]
var whoCmd = &cobra.Command{
	Use:   "who",
	Short: "A simple tool to view Git logs based on the author and time range.",
	Long: `Git Who - Custom Git Logs Tool\n

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
    1. Default: View the logs of the current user in the last week:
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

  For more information, refer to the documentation or visit the Git repository.`,

	Run: func(cmd *cobra.Command, args []string) {
		if contributor == "" {
			getContributors()
		}
		if timeRange == "" {
			selectTimeRange()
		}
		__logs := getLogs(contributor, timeRange)
		logsTable(__logs)

	},
}

func init() {
	rootCmd.AddCommand(whoCmd)
	whoCmd.Flags().StringVarP(&contributor, "contributor", "t", "", "Authors name based on how git registers it")
	whoCmd.Flags().StringVarP(&timeRange, "timerange", "T", "", "Time range of logs to fetch with a default of the past 7 days")
}

func getContributors() {
	__allContributors, _ := exec.Command("git", "log", "--format=%an").Output()
	allContributors := strings.SplitSeq(string(__allContributors), "\n")
	for contributor := range allContributors {
		contributors = append(contributors, huh.NewOption(contributor, contributor))
	}

	contributorsSelect := huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().
				Title("Select assignee").
				Options(contributors...).
				Value(&contributor),
		),
	)

	if timeRange == "" {
		timeRange = "1 week ago"
	}
	if err := contributorsSelect.Run(); err != nil {
		log.Error("Something went wrong", "err", err)
	}

}

func selectTimeRange() {
	ranges := huh.NewOptions(
		"1 day ago",
		"1 week ago",
		"2 weeks ago",
		"1 month ago",
		"3 months ago",
		"6 months ago")

	timeRangeSelect := huh.NewForm(
		huh.NewGroup(
			huh.NewSelect[string]().
				Title("Select time range").
				Options(ranges...).
				Value(&timeRange),
		),
	)
	timeRangeSelect.Run()
}

func getLogs(author string, from string) []UserLogItem {
	var userLogItems []UserLogItem
	baseOrigin := "origin"
	logs, err := exec.Command(
		"git", "log",
		"--oneline",
		"--decorate",
		"--graph",
		"--date=short",
		fmt.Sprintf("--since='%v'", from),
		fmt.Sprintf("--author=%v", author)).
		Output()
	if err != nil {
		fmt.Print(err)
	}

	// TODO:  fix this to better clean up log messages
	// eg1: * 4ab3c4b (HEAD -> feature-V2/who-porting) update: color clean up and unification
	// eg2: * 787bef9 (origin/V2-Beta, V2-Beta) update: git add ons rewrite -> base setup
	for logItem := range strings.SplitSeq(string(logs), "\n") {
		if logItem != "" {
			var userLogItem UserLogItem
			commitLog := strings.Split(logItem, " ")[1:len(strings.Split(logItem, " "))]
			hasOrigin := len(commitLog) == 3
			if hasOrigin {
				userLogItem.Origin = &commitLog[1]
			} else {
				userLogItem.Origin = &baseOrigin
			}
			userLogItem.CommitHash = commitLog[0]
			userLogItem.CommitMessage = commitLog[2]
			userLogItems = append(userLogItems, userLogItem)
		}
	}

	return userLogItems
}

func logsTable(__logs []UserLogItem) {
	columns := []string{"Commit Hash", "Commit message", "Origin"}
	var rows [][]string
	for _, logItem := range __logs {
		rows = append(rows, []string{
			logItem.CommitHash,
			logItem.CommitMessage,
			*logItem.Origin,
		})
	}
	table := table.New().
		Border(lipgloss.HiddenBorder()).
		Headers(columns...).
		Rows(rows...).
		StyleFunc(func(row, col int) lipgloss.Style {
			// TODO: make this color apply to column names onlys
			if col == 1 {
				return lipgloss.NewStyle().
					Width(60).
					PaddingLeft(2).
					Foreground(lipgloss.Color("#404040"))

			}
			if col == 2 {
				return lipgloss.NewStyle().
					PaddingLeft(2).
					Foreground(lipgloss.Color("#9333ea"))
			}
			return lipgloss.NewStyle().
				Foreground(lipgloss.Color("#fbbf24"))
		})
	fmt.Printf("%v\n", table.Render())
}
