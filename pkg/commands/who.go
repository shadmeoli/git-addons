package commands

import (
	"os/exec"
	"strconv"
	"time"

	"github.com/charmbracelet/log"
	"github.com/spf13/cobra"
)

type Who struct {
	cmd  *cobra.Command
	args []string
}

var contributor, timeRange string
var contributors []string
var whoCmd = &cobra.Command{
	Use:   "who",
	Short: "A simple tool to view Git logs based on the author and time range.",
	Long: `Git Who - Custom Git Logs Tool
  ================================

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
		who := Who{cmd: cmd, args: args}
		if len(args) == 0 {
			if err := who.Run(); err != nil {
				log.Info("Could not fetch current author")
			}
		}
		who.getContributors()
	},
}

func currentContributor() string {
	value, err := exec.Command("git", "config", "user.name").Output()
	if err != nil {
		log.Errorf("Could not get current author", err)
		return ""
	}
	return string(value)
}

func init() {
	rootCmd.AddCommand(whoCmd)
	currentActiveContributor := currentContributor()
	whoCmd.Flags().StringVarP(&contributor, "contributor", "t", currentActiveContributor, "Current author")
	whoCmd.Flags().StringVarP(&timeRange, "timerange", "T", strconv.Itoa(time.Now().Day()), "Time range of logs to fetch with a default of the past 7 days")
}

func (w *Who) Run() error {
	__currentActiveContributor := currentContributor()
	log.Infof("Contributor: %v", __currentActiveContributor)
	return nil
}

func (w *Who) getContributors() {
	// __allContributors, _ := exec.Command("git", "log", "--format='%an'", "| sort", "| uniq").Output()
	__allContributors, _ := exec.Command("git", "log", "--format='%an'").Output()
	allContributors := string(__allContributors)
	log.Info(allContributors)

}
func (w *Who) getAuthors()                           {}
func (w *Who) getLogs(author string, from time.Time) {}
