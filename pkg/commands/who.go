package commands

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

// type Who struct {
// 	cmd  *cobra.Command
// 	args []string
// }

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
		logs := getLogs(contributor, timeRange)
		fmt.Print(strings.Join(logs, "\n"))
	},
}

func init() {
	rootCmd.AddCommand(whoCmd)
	// currentActiveContributor := currentContributor()
	whoCmd.Flags().StringVarP(&contributor, "contributor", "t", "", "Authors name based on how git registers it")
	whoCmd.Flags().StringVarP(&timeRange, "timerange", "T", "", "Time range of logs to fetch with a default of the past 7 days")
}

// func (w *Who) Run() error {
// 	__currentActiveContributor := currentContributor()
// 	log.Infof("Contributor: %v", __currentActiveContributor)
// 	return nil
// }

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
	ranges := huh.NewOptions("1 day ago",
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

func getLogs(author string, from string) []string {
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

	return strings.Split(string(logs), "\n")
}
