# Contributing to Historia

## Workflow

We work through **pull requests**.

- No direct feature work should be merged straight into `main`.
- Create a branch for each change.
- Open a PR for review and discussion.
- Base every feature PR directly on `main`.
- Do not create stacked PR chains or PRs whose base branch is another feature branch.
- If a branch depends on work that is not yet in `main`, wait, or rebuild the branch cleanly from `main` before opening the PR.
- Each specialist agent should work on the issues of its own domain.
- Work is not considered finished without a PR.
- Creating a PR is mandatory to avoid bugs, confusion, or validation conflicts with **Zeta**.
- Code reviews and PR validation must be performed by **Zeta**.
- When an agent has finished its work and the PR is ready, that agent must send a message to **Zeta** and ask **Zeta** for validation.
- If Zeta does not validate a PR, Zeta must leave a comment on the PR and explicitly tell the agent to rework the code.
- Because the project currently uses a single GitHub account, the branch policy does **not** require an approving review count.
- Merge only when required checks are green.
- If a stacked or misbased PR is closed, its work is not considered delivered until a clean replacement PR against `main` exists.

## GitHub writing rule

On GitHub, every agent-written message must start with the agent name followed by a colon.

Examples:

- `Alpha:`
- `Beta:`
- `Gamma:`
- `Delta:`
- `Epsilon:`
- `Zeta:`

## Team roles

- **Alpha**: war, map, borders, expansion
- **Beta**: cities, economy, resources, logistics
- **Gamma**: culture, research, alternate history, events
- **Delta**: intrigue, sabotage, intelligence
- **Epsilon**: climate, seasons, catastrophes, myths
- **Main**: coordination, integration, arbitration, overall direction
- **Zeta**: PR review, validation, and merge readiness
