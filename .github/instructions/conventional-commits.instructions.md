# Commit Pattern

Always generate commit messages following Conventional Commits.

## Format
Use this structure:

type(scope): short description

## Rules
- Write commit messages in the imperative mood.
- Keep the summary short and objective.
- Use lowercase types.
- Use a scope when it adds clarity.
- Avoid vague messages like "update", "fixes", "changes", or "stuff".
- Prefer one commit per logical change.
- Do not mix unrelated changes in the same commit.
- When needed, add a body explaining why the change was made, not only what was changed.
- Use breaking change notation only when the change is truly incompatible.

## Allowed types
- feat: new functionality
- fix: bug fix
- docs: documentation only
- style: formatting, whitespace, linting, no logic change
- refactor: code restructuring without behavior change
- perf: performance improvement
- test: tests added or adjusted
- build: build system or dependencies
- ci: CI/CD changes
- chore: maintenance tasks
- revert: revert previous commit

## Examples
- feat(auth): add user login flow
- fix(form): prevent duplicate submission
- docs(readme): update setup instructions
- refactor(service): simplify token handling
- test(auth): add unit tests for login
- chore(deps): update angular material version

## Commit body
When useful, include a body after a blank line:
- explain the reason for the change
- mention side effects or important decisions
- reference related tickets or issues

Example:

feat(users): create user-service binding flow

Users must exist before being linked to a service, so this flow now creates the user first and then performs the association.
