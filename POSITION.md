# GitHuman: The Missing Layer in AI-Assisted Development

## The Shift

Software development is undergoing its most significant transformation since the advent of version control. AI coding agents—Claude, Copilot, Cursor, and others—are no longer autocomplete tools. They are autonomous agents capable of writing entire features, refactoring codebases, and fixing complex bugs.

The code review process, however, remains stuck in 2008.

## The Problem

GitHub revolutionized how humans collaborate on code. Pull requests, code review, and merge workflows became the standard for teams building software together. But this model assumes a critical premise: **humans write the code**.

Today, that premise is breaking down.

When an AI agent writes code, the traditional PR workflow creates friction:

1. **The agent produces changes locally** — staged in git, ready to commit
2. **The developer commits blindly** — trusting the agent, or skimming diffs in the terminal
3. **A PR is created** — now teammates review AI-generated code they didn't request
4. **Review fatigue sets in** — reviewers lack context on why the AI made specific choices

The review happens too late. By the time code reaches a PR, the developer has already committed to the agent's approach. The cognitive cost of rejecting or heavily modifying the changes increases. Bad patterns slip through.

## The Insight

The natural checkpoint for AI-generated code isn't the pull request. It's the **staging area**.

Before `git commit`, there's a moment of truth. The developer can inspect what the agent produced, understand the changes, and make an informed decision. This is where human judgment belongs—not after the code is committed and pushed, but before.

Yet today, this review happens in the terminal with `git diff`. A wall of green and red text. No comments. No way to mark issues. No persistent record of what was reviewed.

## The Vision

**GitHuman** reimagines the relationship between developers and AI agents.

It provides a dedicated interface for reviewing AI-generated changes before they become commits. A local code review tool that treats the staging area as a first-class review surface.

With GitHuman, developers can:

- **Visualize changes** in a proper diff viewer, not terminal output
- **Add comments** to specific lines, noting concerns or questions
- **Create todos** for follow-up work the agent should address
- **Approve or reject** changes with intention, not by default
- **Maintain a record** of what was reviewed and why

## Why This Matters

The developers who thrive in the AI era won't be those who blindly accept agent output. They'll be those who maintain agency over their codebase—who review, understand, and deliberately approve every change.

This isn't about distrusting AI. It's about professional responsibility. The same responsibility that led us to adopt code review in the first place.

GitHub asked: "How should humans collaborate on code?"

GitHuman asks: "How should humans review code written by AI?"

## The Principles

1. **Human in the loop** — Every AI-generated change deserves human review
2. **Review before commit** — The staging area is the natural checkpoint
3. **Local first** — Your code, your machine, your review process
4. **Tool agnostic** — Works with any AI agent that produces git changes
5. **Simple by default** — A review tool, not a workflow platform

## The Future

As AI agents become more capable, the temptation to trust them completely will grow. But capability is not infallibility. Models hallucinate. Context gets lost. Edge cases get missed.

The developers and teams that maintain rigorous review practices—even for AI-generated code—will ship more reliable software. They'll catch subtle bugs before production. They'll maintain codebases they actually understand.

GitHuman is the tool for that discipline.

---

*GitHuman: Because someone should review the code before it's committed. That someone is you.*
