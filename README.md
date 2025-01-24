# git-addons


Git Who - Custom Git Logs Tool
================================

A simple tool to view Git logs based on the author and time range.

#### Usage:
```sh
git who [author_name] [--t] [--T]
```

#### Options:
`
[author_name]    Specify the author's name to view their logs (default is the current user).
--t              Enable interactive mode to select an author from the contributors.
--T              Enable interactive time selection (choose from options like "1 week ago", "1 month ago", etc.).
--help           Show this help message and exit.
`

#### Interactive Options:
*--t* and *--T* are optional flags that can be used together to interactively select both the author and the time range.

Examples:
1. Default: View the logs of the current user in the last week:
   git who
   
2. View the logs for a specific author in the last week:
   git who "Author Name"

3. Interactive mode to select an author:
   git who --t

4. Interactive mode to select an author and a time range:
   git who --t --T

Time Range Options (used with --T):
"1 day ago"
"1 week ago"
"2 weeks ago"
"1 month ago"
"3 months ago"
"6 months ago"



To install dependencies:

```bash
bun install
```

To run:

```bash
bun run app.js
```


to build run.
```sh
make build-arm-mac

```

View more on how to compile for your distro or os [here](https://bun.sh/docs/bundler/executables)

