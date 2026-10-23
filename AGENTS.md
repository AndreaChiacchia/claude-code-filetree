# Agent rules for this repository

## Credit every contributor

- Every merged pull request, adopted idea and confirmed bug report gets a line in `ACKNOWLEDGEMENTS.md` under Code, Ideas or Bug reports, naming the GitHub handle, what they gave and the PR or issue number
- A feature rebuilt from someone's pull request or suggestion still credits them under Ideas, even when none of their code shipped
- Release notes credit the same people: each line that comes from a contributor ends with `(@handle, #n)`
- Add the attribution in the same change that lands the work; a release is not cut while `ACKNOWLEDGEMENTS.md` is missing someone in it

## Colors

- Every built-in color passes `bun scripts/contrast.ts`: text, git, line-count and bright shimmer colors at 3:1 on dark terminal backgrounds, dim shimmer steps at 2:1, and the light palette at 7:1 on white, the hover and the selected row
- The `contrast` workflow runs that gate on any change that adds or edits a hex color under `hooks/`; fix the color, never lower the gate

## Merging

- Wait for the Codex review on a pull request to finish (its summary comment says completed for the head commit) and fix or answer every finding before merging; CI passing is not enough

## This fork (AndreaChiacchia/claude-code-filetree)

The rules above are upstream's and apply to pull requests to upstream. Releases of this fork follow the procedure below instead.

### Release procedure

This procedure overrides the global "Merge & Release" procedure for this repository. It is the same procedure plus step 9, because this mod is installed from the local `claude-mods` marketplace (`projects/mods/.claude-plugin/marketplace.json`): Claude Code runs an installed copy under `~/.claude/plugins/cache/claude-mods/filetree/<version>/`, not this folder.

1. Determine the SemVer level from the commits since the last tag (the higher level wins if mixed).
2. Bump `version` in `.claude-plugin/plugin.json` on `staging` and commit it there: `Bump version to <x.y.z>`.
3. Update the version badge in `README.md` to the new version, and check whether any other README content needs updating (new features, changed behavior). Commit on `staging`: `Update README version badge to <x.y.z>`.
4. Push `staging`.
5. Switch to `main` and merge `staging`.
6. Push `main`.
7. Switch back to `staging`, fast-forward it to `main`, and push: `git checkout staging && git merge main && git push origin staging`.
8. Compile a changelog from the commits since the last tag, one line each: a type prefix (`feat:`, `fix:`, `perf:`, `chore:`, ...), a concise summary and the short hash in parentheses; features first, then fixes, then the rest; no sections. Tag `main` with an annotated tag holding it and push the tag: `git tag -a v<x.y.z> main -m "<changelog>" && git push origin v<x.y.z>`.
9. Install the release: with this repository on `staging` (now equal to `main`), run `claude plugin marketplace update claude-mods && claude plugin update filetree@claude-mods`, then `/reload-plugins` in Claude Code (or restart it). The version bump in step 2 is required: installed copies are kept per version, so an unchanged version may not refresh.

### Working on this mod

- Editing this folder never changes the running mod; only step 9 does. Changes here are safe to make in any mode.
- Check a change before releasing it: `npx -y -p typescript@5.6.3 tsc -p .` and `claude plugin test .`.
- To try unreleased code live, start Claude Code with this folder in `CLAUDE_CODE_PLUGIN_DIRS` for that session only; do not leave it set, or the folder becomes the live mod again.
