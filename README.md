# @maastrich/moonx

## Overview

MoonX is a CLI tool that makes it easy to run Moon tasks on multiple workspaces. It automatically scans for Moon tasks in your workspaces and creates a command for each task. You can then run the task on all of your workspaces or on a subset of workspaces.

## Installation

To use MoonX, first install moon it globally with:

```sh
proto install moon
```

Then install MoonX with:

```sh
pnpm install @maastrich/moonx -g # global install is optional but recommended
```

## Usage

### Running Moon tasks

Once MoonX is installed, you can scan for Moon tasks in your workspaces with:

```sh
moonx <command> [...workspaces] [MOON_OPTIONS] -- [COMMAND_OPTIONS]
```

### Help

MoonX provides comprehensive help information for both the MoonX CLI and the Moon tasks that are available in your workspaces. To get help for the MoonX CLI, run:

```sh
moonx --help
```

To get help for a specific Moon task, run:

```sh
moonx <task> --help
```

### Examples

For example, to get help for the `build` task, you would run:

```sh
moonx build --help
```
