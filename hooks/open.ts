export const LINUX_LAUNCH = 'setsid -f -w "$@" </dev/null >/dev/null 2>&1 & p=$!; sleep 1; kill -0 "$p" 2>/dev/null && exit 0; wait "$p"'

export const LINUX_OPEN = [
  'set -f',
  'f=$1',
  'if command -v gio >/dev/null; then',
  '  if [ -f "$f" ] && command -v file >/dev/null && encoding=$(file -b --mime-encoding -- "$f") && [ -n "$encoding" ] && [ "$encoding" != binary ]; then',
  '    case $(gio info -a standard::content-type -- "$f" | sed -n \'s/.*standard::content-type: //p\') in',
  '      video/* | audio/*)',
  '        app=$(xdg-mime query default text/plain)',
  '        IFS=:',
  '        for dir in "${XDG_DATA_HOME:-$HOME/.local/share}" ${XDG_DATA_DIRS:-/usr/local/share:/usr/share}; do',
  '          [ -n "$app" ] && [ -f "$dir/applications/$app" ] && exec gio launch "$dir/applications/$app" "$f"',
  '        done',
  '        echo "No text/plain desktop application found for $f" >&2',
  '        exit 1',
  '        ;;',
  '    esac',
  '  fi',
  '  if (exec gio open "$f"); then exit 0; fi',
  'fi',
  'exec xdg-open "$f"',
].join('\n')

const WIN_OPEN = "$ErrorActionPreference = 'Stop'; [Diagnostics.Process]::Start([Diagnostics.ProcessStartInfo]@{ FileName = $env:PANE_OPEN_TARGET; UseShellExecute = $true }) | Out-Null"

export function openCommand(os: 'linux' | 'darwin' | 'win32', target: string) {
  const argv = os === 'linux'
    ? ['sh', '-c', LINUX_LAUNCH, 'sh', 'sh', '-c', LINUX_OPEN, 'sh', target]
    : os === 'darwin'
      ? ['open', '--', target]
      : ['powershell', '-NoProfile', '-NonInteractive', '-Command', WIN_OPEN]
  return {
    argv,
    init: {
      timeoutMs: 10_000,
      ...(os === 'win32' ? { env: { PANE_OPEN_TARGET: /^[a-z][a-z0-9+.-]*:\/\//i.test(target) ? target : target.replace(/\//g, '\\') } } : {}),
    },
  }
}

function words(command: string): string[] {
  const out: string[] = []
  let word: string | null = null
  let quote = ''
  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = ''
      else word = (word ?? '') + ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      word ??= ''
    } else if (/\s/.test(ch)) {
      if (word !== null) out.push(word)
      word = null
    } else word = (word ?? '') + ch
  }
  if (word !== null) out.push(word)
  return out
}

export function openWithCommand(command: string, path: string, dir: string): string[] | null {
  const argv = words(command)
  if (!argv.length) return null
  const filled = argv.map(w => w.replace(/\{(path|dir)\}/g, (_, key) => (key === 'path' ? path : dir)))
  return argv.some(w => w.includes('{path}')) ? filled : [...filled, path]
}

export const FONT_SCRIPT =
  'if command -v fc-list >/dev/null 2>&1; then f=$(fc-list ":charset=$1" file | grep -vi lastresort | head -n1 | cut -d: -f1); fi; ' +
  '[ -n "$f" ] || f=$(ls "$HOME"/Library/Fonts/*Nerd* /Library/Fonts/*Nerd* 2>/dev/null | head -n1); ' +
  '[ -n "$f" ] || { echo missing; exit 0; }; m=$(stat -c %Z "$f" 2>/dev/null || stat -f %c "$f"); p=$PPID; ' +
  'while [ -n "$p" ] && [ "$p" -gt 1 ]; do c=$(ps -o comm= -p "$p" 2>/dev/null); c=$(basename "$c" 2>/dev/null | tr -d " "); case "$c" in ' +
  'ghostty|kitty|alacritty|Alacritty|foot|footclient|wezterm-gui|konsole|gnome-terminal-|xterm|urxvt|st|Terminal|iTerm2) ' +
  'e=$(ps -o etime= -p "$p" 2>/dev/null | awk -F\'[-:]\' \'{n=NF; s=$n+60*$(n-1); if (n>2) s+=3600*$(n-2); if (n>3) s+=86400*$(n-3); print s}\'); [ -n "$e" ] && [ $(( $(date +%s) - e )) -lt "$m" ] && echo stale || echo ok; exit 0;; esac; ' +
  'p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d " "); done; echo ok'
