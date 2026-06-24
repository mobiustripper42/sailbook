---
name: bump-major
description: Manually bump the project's major version. Use for breaking changes — new data model, removed feature, anything users would notice on upgrade. Dev projects only (requires `package.json`). Writes a CHANGELOG.md entry and tags on the active trunk (`main`).
tools: Read, Edit, Write, Bash, Grep
---

You are bumping the project's major version. Major bumps are manual because they signal a breaking change — there's no automatic trigger that knows what counts as breaking.

## Step 0 — Sanity gate

Run `[ -f package.json ] || echo "missing"`. If `package.json` is missing at the repo root, STOP. Tell the user: "/bump-major requires `package.json` (DEC-007 — dev projects only). This repo has none." Do not proceed.

## Step 1 — Resolve working branch

```
WORKING_BRANCH=main
```
The active trunk is always `main` (DEC-S022). `production` (if any) only moves at `/promote-production`.

`BRANCH=$(git branch --show-current)`.

If `BRANCH != $WORKING_BRANCH`: STOP. Major bumps must run on the working branch (otherwise the bump lands on a feature branch and gets orphaned at PR merge). Tell the user: "Switch to `$WORKING_BRANCH` and re-run /bump-major." Wait.

## Step 2 — Confirm the bump

Read the current version:
```
CURRENT_VERSION=$(npm pkg get version | tr -d '"')
```
`npm pkg get` is JSON-aware and handles minified single-line `package.json`. If `CURRENT_VERSION` is empty, STOP and surface "Could not parse version from package.json — is the file valid JSON with a `version` field?"

Compute the new version: split `CURRENT_VERSION` on `.`, increment the first segment, set the other two to `0`. Hold as `NEW_VERSION`.

Ask the user: **"Bump v$CURRENT_VERSION → v$NEW_VERSION? Tell me the breaking change in one line — it goes into CHANGELOG.md."** Wait for both confirmation and the rationale string. Hold the rationale as `RATIONALE`.

If the user declines, stop with no changes.

## Step 3 — Bump

```
npm version major --no-git-tag-version
```

`npm version major` zeros minor + patch automatically (e.g. `1.7.3 → 2.0.0`). Verify the result matches `NEW_VERSION` from Step 2; if not (someone modified package.json mid-flight), STOP and surface the discrepancy.

## Step 4 — CHANGELOG entry

If `CHANGELOG.md` doesn't exist, create with `# Changelog\n\n`. If it exists but doesn't start with the literal `# Changelog\n` header (e.g. setext form, `# CHANGELOG`, or notes above the header), STOP and surface to the user — do not guess where to insert. Otherwise prepend after the `# Changelog` header (newest at top):

```
## [<NEW_VERSION>] - <YYYY-MM-DD> — Major release
- BREAKING: <RATIONALE>
```

## Step 5 — Commit + tag + push

```
git add package.json CHANGELOG.md
[ -f package-lock.json ] && git add package-lock.json
git commit -m "Bump major version to v$NEW_VERSION — <RATIONALE>"
```

**Tag:**
```
git tag "v$NEW_VERSION"
```
Tags land on the trunk at bump time. Promotion to `production` (if the project has it) carries the already-tagged commit — `/promote-production` does not tag.

**Push:**
```
git push origin "$WORKING_BRANCH"
```
If a tag was created: `git push origin "v$NEW_VERSION"`.

## Step 6 — Summary

```
v<CURRENT_VERSION> → v<NEW_VERSION> (major)
Branch: <WORKING_BRANCH>
Tag: v<NEW_VERSION>
CHANGELOG.md updated.
```

Remind the user: a major bump usually deserves a release note beyond the CHANGELOG line — consider drafting one before the next deploy.
