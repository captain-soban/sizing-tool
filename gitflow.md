# Git Workflow for SvelteKit Planning Poker

This repository uses a lightweight trunk-based workflow. `main` is the only permanent branch unless the team deliberately adds a temporary integration branch for a large coordinated effort.

## Main Branch

- **`main`**
  - Production-ready code only
  - Deployable at any time
  - Protected by local hooks and GitHub Actions quality checks

Avoid creating a long-lived `dev` branch by default. Add one only when several active branches need shared integration before they are ready for `main`.

## Branch Naming

Use short-lived branches with one focused purpose.

```bash
git checkout main
git pull origin main
git checkout -b feature/session-management
```

Common prefixes:

- `feature/` for new product behavior
- `fix/` for defects
- `refactor/` for structural changes without behavior changes
- `docs/` for documentation-only updates
- `hotfix/` for urgent production fixes branched from `main`

Examples:

```bash
feature/poker-table-ui
fix/session-code-validation
refactor/local-storage-utilities
docs/git-workflow
hotfix/session-data-loss
```

## Standard Flow

1. Start from an updated `main`.
2. Create a focused branch.
3. Make small, reviewable commits.
4. Run local checks.
5. Push the branch and open a pull request to `main`.
6. Merge after review and passing CI.
7. Delete the local and remote branch after merge.

```bash
npm run lint
npm run check
npm run test:unit:run
npm run build
```

## Hotfix Flow

Hotfixes branch from `main` and merge back into `main` through a pull request.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue
```

If a temporary integration branch exists, backport or merge the hotfix there after it lands on `main`.

## Quality Gates

Local pre-commit checks run through Husky:

```bash
npm run lint
npm run check
npm run test:unit:run
```

GitHub Actions runs on pushes to `main` and on pull requests:

```bash
npm ci
npm run lint
npm run check
npm run test:unit:run
npm run build
```

End-to-end tests should be added to CI after an `e2e/` test suite exists.

## Commit Messages

Use conventional commits:

```bash
feat(voting): add story point selection
fix(session): resolve localStorage persistence issue
refactor(ui): reorganize component structure
docs(readme): update setup instructions
```

## Cleanup

After a branch is merged:

```bash
git branch -d feature/branch-name
git push origin --delete feature/branch-name
git remote prune origin
```

PowerShell cleanup for merged local branches:

```powershell
git branch --merged main |
  ForEach-Object { $_.Trim() } |
  Where-Object { $_ -and $_ -ne 'main' -and -not $_.StartsWith('*') } |
  ForEach-Object { git branch -d $_ }
```

Bash cleanup for merged local branches:

```bash
git branch --merged main | grep -v '^\*' | grep -v '^  main$' | xargs -r git branch -d
```

## Repository Health Checks

PowerShell:

```powershell
git status --short --branch
git log --oneline --decorate -10
git remote prune origin
Get-ChildItem -Recurse -File -Force |
  Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\' } |
  Sort-Object Length -Descending |
  Select-Object -First 10 FullName, Length
```

Bash:

```bash
git status --short --branch
git log --oneline --decorate -10
git remote prune origin
find . -type f -size +1M -not -path './.git/*' -not -path './node_modules/*'
```

Sensitive-file audit:

```bash
git log --all --full-history -- "*.env*" "*.key" "*.pem"
```

## Current Cleanup Status

As of this workflow update, the repository is expected to stay on `main` unless active work is moved to a short-lived branch. Before cleanup, verify:

```bash
git status --short --branch
git branch --all --verbose
git remote prune origin
```
