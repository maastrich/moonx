export type Shell = "bash" | "zsh" | "fish";

/**
 * Generate shell completion script for moonx
 *
 * The completion scripts use `moonx _moonx_list` which automatically caches results
 * for 5 minutes (configurable via MOONX_CACHE_TTL env var in milliseconds).
 *
 * Cache management:
 * - `moonx cache:info` - Show cache status and location
 * - `moonx cache:clear` - Clear the cache
 */
export function generateCompletion(shell: Shell): string {
  switch (shell) {
    case "bash":
      return generateBashCompletion();
    case "zsh":
      return generateZshCompletion();
    case "fish":
      return generateFishCompletion();
    default:
      throw new Error(`Unknown shell: ${shell}`);
  }
}

function generateBashCompletion(): string {
  return `# moonx completion script for bash
# Add this to your ~/.bashrc or ~/.bash_profile:
# eval "$(moonx completion bash)"

_moonx_completion() {
    local cur prev words cword
    _init_completion || return

    if [ $cword -eq 1 ]; then
        # Complete commands
        COMPREPLY=($(compgen -W "$(moonx _moonx_list)" -- "$cur"))
        return 0
    fi

    if [ $cword -ge 2 ]; then
        # Complete workspaces for the selected command
        local command="\${words[1]}"
        COMPREPLY=($(compgen -W "$(moonx _moonx_list "$command")" -- "$cur"))
        return 0
    fi
}

complete -F _moonx_completion moonx
complete -F _moonx_completion mx
`;
}

function generateZshCompletion(): string {
  return `# moonx completion script for zsh
# Add this to your ~/.zshrc:
# eval "$(moonx completion zsh)"

_moonx_completion() {
    local state line

    _arguments -C \\
        '1: :->command' \\
        '*: :->workspace'

    case $state in
        command)
            local commands
            commands=("\${(@f)$(moonx _moonx_list)}")
            _describe 'command' commands
            ;;
        workspace)
            local workspaces
            workspaces=("\${(@f)$(moonx _moonx_list $line[1])}")
            _describe 'workspace' workspaces
            ;;
    esac
}

compdef _moonx_completion moonx
compdef _moonx_completion mx
`;
}

function generateFishCompletion(): string {
  return `# moonx completion script for fish
# Add this to your ~/.config/fish/completions/moonx.fish:
# moonx completion fish > ~/.config/fish/completions/moonx.fish

# Remove previous completions
complete -c moonx -e
complete -c mx -e

# Complete commands
complete -c moonx -f -n "__fish_is_first_token" -a "(moonx _moonx_list)"
complete -c mx -f -n "__fish_is_first_token" -a "(moonx _moonx_list)"

# Complete workspaces
complete -c moonx -f -n "not __fish_is_first_token" -a "(moonx _moonx_list (commandline -opc)[2])"
complete -c mx -f -n "not __fish_is_first_token" -a "(moonx _moonx_list (commandline -opc)[2])"
`;
}
