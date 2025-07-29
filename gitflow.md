# Git Branching Strategy for SvelteKit Planning Poker

This file defines the branching conventions and workflow for organized and efficient development.

## Table of Contents

1. [Main Branches](#main-branches)
2. [Branch Types & Naming](#branch-types--naming)
3. [Branching Workflow](#branching-workflow)
4. [Maintenance and Cleanup](#maintenance-and-cleanup)

---

## Main Branches

These branches represent the core states of the repository:

- **`main`**
  - Production-ready code only
  - All commits must pass quality checks (lint, typecheck, tests)
  - Deployable at any time

- **`dev`** *(Optional)*
  - Integration branch for complex features
  - Use only if needed for multi-feature coordination

---

## Branch Types & Naming

### Feature Branches
For new functionality or components.

**Prefix:** `feature/`

**Examples:**
```bash
git checkout -b feature/session-management
git checkout -b feature/voting-mechanics
git checkout -b feature/poker-table-ui
```

### Bug Fix Branches
For addressing defects and issues.

**Prefix:** `fix/`

**Examples:**
```bash
git checkout -b fix/session-code-validation
git checkout -b fix/vote-reveal-timing
```

### Refactor Branches
For code restructuring without changing functionality.

**Prefix:** `refactor/`

**Examples:**
```bash
git checkout -b refactor/localStorage-utilities
git checkout -b refactor/component-architecture
```

### Hotfix Branches
For critical production issues requiring immediate fixes.

**Prefix:** `hotfix/`

**Examples:**
```bash
git checkout -b hotfix/session-data-loss
git checkout -b hotfix/voting-crash
```

**Special workflow:**
1. Branch from `main`
2. Fix the issue
3. Merge back to both `main` and `dev` (if using dev branch)

### Release Branches *(Optional)*
For preparing new versions.

**Prefix:** `release/`

**Examples:**
```bash
git checkout -b release/v1.0.0
git checkout -b release/v1.2.0
```

---

## Branching Workflow

### Standard Development Flow

1. **Start from main:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Develop with atomic commits:**
   ```bash
   git add .
   git commit -m "feat: implement session creation logic"
   ```

4. **Push branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request:**
   - Target: `main` (or `dev` if using)
   - Include description of changes
   - Reference any related issues

6. **Code review and merge:**
   - Address feedback
   - Ensure all quality checks pass
   - Merge when approved

7. **Clean up:**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

### Hotfix Workflow

1. **Branch from main:**
   ```bash
   git checkout main
   git checkout -b hotfix/critical-issue
   ```

2. **Fix and test:**
   ```bash
   git commit -m "fix: resolve critical session bug"
   ```

3. **Merge to main:**
   - Create PR to `main`
   - Fast-track review for critical fixes

4. **Backport to dev** *(if using dev branch)*

---

## Git Maintenance and Cleanup

### Daily/Weekly Tasks

#### Branch Cleanup
Delete branches after successful merge:
```bash
# Delete local feature branch after merge
git branch -d feature/branch-name

# Delete remote branch
git push origin --delete feature/branch-name

# Automated cleanup of merged branches
git branch --merged main | grep -v main | xargs -n 1 git branch -d
```

#### Keep Repositories Synchronized
```bash
# Update local main with remote changes
git checkout main
git pull origin main

# Sync dev branch with main (if using dev)
git checkout dev
git merge main
git push origin dev

# Clean up remote tracking references
git remote prune origin
```

### Weekly/Monthly Maintenance

#### Repository Health Checks
```bash
# Check for large files that shouldn't be tracked
git ls-files | xargs ls -la | sort -nrk5 | head -10

# View repository size
du -sh .git

# Check for uncommitted changes across all branches
git status --porcelain

# Verify no sensitive files are tracked
git log --all --full-history -- "*.env*" "*.key" "*.pem"
```

#### Git History Optimization
```bash
# Garbage collection to optimize repository
git gc --aggressive --prune=now

# Repack repository for better performance
git repack -ad

# Clean up unnecessary files and optimize
git fsck --full
```

### Quality Standards Enforcement

#### Pre-commit Hook Verification
Ensure hooks are working:
```bash
# Test pre-commit hooks manually
npm run lint
npm run check

# Verify husky installation
npx husky --version
cat .husky/pre-commit
```

#### Commit Message Standards
Use conventional commits for better tracking:
```bash
# Good examples
git commit -m "feat(voting): add story point selection"
git commit -m "fix(session): resolve localStorage persistence issue"
git commit -m "refactor(ui): reorganize component structure"
git commit -m "docs(readme): update setup instructions"

# Check recent commit messages
git log --oneline -10
```

### Troubleshooting Common Issues

#### Reset and Recovery
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - USE WITH CAUTION
git reset --hard HEAD~1

# Recover accidentally deleted branch
git reflog
git checkout -b recovered-branch <commit-hash>

# Restore deleted file from previous commit
git checkout HEAD~1 -- path/to/file
```

#### Merge Conflicts Resolution
```bash
# Abort current merge
git merge --abort

# Continue merge after resolving conflicts
git add .
git commit -m "resolve merge conflicts"

# Use merge tool for conflicts
git mergetool
```

#### Large File Management
```bash
# Remove large file from history (USE WITH CAUTION)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/large/file' \
  --prune-empty --tag-name-filter cat -- --all

# Alternative using git-filter-repo (recommended)
git filter-repo --path path/to/large/file --invert-paths
```

### Automated Maintenance Scripts

#### Weekly Cleanup Script
Create `.git/hooks/weekly-cleanup.sh`:
```bash
#!/bin/bash
echo "Running weekly git maintenance..."

# Clean up merged branches
git branch --merged main | grep -v main | xargs -n 1 git branch -d

# Update main branch
git checkout main
git pull origin main

# Garbage collection
git gc --auto

# Prune remote references
git remote prune origin

echo "Git maintenance complete!"
```

#### Repository Health Check Script
```bash
#!/bin/bash
echo "Git Repository Health Check"
echo "=========================="

echo "Repository size:"
du -sh .git

echo -e "\nBranch count:"
git branch -a | wc -l

echo -e "\nRecent activity:"
git log --oneline -5

echo -e "\nUntracked files:"
git status --porcelain | grep "^??"

echo -e "\nLarge files (>1MB):"
find . -type f -size +1M -not -path "./.git/*" -not -path "./node_modules/*"
```

### Best Practices Checklist

- [ ] Delete feature branches after merge
- [ ] Run `git pull` before creating new branches
- [ ] Use descriptive commit messages
- [ ] Test changes before committing
- [ ] Review code before merging
- [ ] Keep branches focused on single features
- [ ] Regularly sync with remote repository
- [ ] Run weekly repository cleanup
- [ ] Monitor repository size and performance
- [ ] Backup important work before major operations

---

## Commit Message Convention

Use conventional commits for better tracking:

```
type(scope): description

feat(voting): add story point selection
fix(session): resolve localStorage persistence issue
refactor(ui): reorganize component structure
docs(readme): update setup instructions
```

