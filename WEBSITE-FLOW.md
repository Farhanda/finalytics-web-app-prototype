# How autom8 Works — From Project to Finished Task

This is a plain-language walkthrough of the autom8 website: what happens from the
moment an **Admin creates a project** all the way to a **team member finishing a
task**. No technical background needed — if you can use a project board, you can
follow this.

---

## Overview

autom8 keeps your project board in step with the real work your team does. A
project starts with a brief, turns into a set of tasks, those tasks get assigned
and worked on, and — when code is pushed to GitHub — autom8 keeps track and sends
a tidy summary to Discord every evening. The goal: everyone can see who's doing
what, and how far along things are, without anyone having to chase status updates.

---

## The three roles

Everyone on autom8 has one of three roles. Your role decides what you see and what
you can do.

| Role | What they see | What they can do |
| --- | --- | --- |
| **Admin** | Everything | Create projects, manage anything, see all tasks. **Only an Admin can create a project.** |
| **PM** (Project Manager) | Only the projects they own | Add and assign tasks, generate tasks from a brief with AI, manage their own projects. |
| **Member** (Team member) | Only their projects, and the tasks they own or created | Pick up assigned tasks, create their own tasks, and mark their work complete. |

---

## The journey at a glance

```
   Admin                 PM                       Member
     │                    │                          │
     ▼                    ▼                          ▼
 Create project ──▶  Add tasks            ──▶  Find assigned task (Pending)
 (link a repo,       (by hand, or                     │
  pick a PM &         AI from a brief)                ▼
  members)                │                     Start work (In-progress)
                          │                           │
                          ▼                           ▼
                   Assign to a member  ──────▶  Finish it (Completed)
                                                      │
                                                      ▼
                                          Daily Discord report 🎉
```

---

## Step 1 — An Admin creates a project

Only an **Admin** can start a new project. From the dashboard, the Admin opens the
**New Project** dialog and fills in:

- **Project name** — e.g. *Landing Page Redesign* (required).
- **Client** — who the work is for.
- **GitHub repository** — the code repo this project lives in (required). It's
  picked from a dropdown of repos autom8 already has access to.
- **Project Manager (PM)** — the person who will own delivery of this project.
- **Team members** — the people who will work on it.
- **Target delivery date**, **status** (*On track* / *At risk* / *Delayed*), and
  **progress %**.

Once saved, the project appears on the dashboard. From this point the **PM owns
it**: they can add and assign work, while the assigned **members** can see the
project and start picking up tasks.

---

## Step 2 — Tasks land on the board

A project on its own does nothing until it has **tasks**. There are two ways to get
them onto the board.

### 2a. Add tasks by hand

A PM (or an Admin) opens the **Create Task** dialog and enters:

- **Task name**
- **Project** it belongs to
- **Assignee** — the team member who'll do it
- **Due date**, **priority** (*High* / *Medium* / *Low*), and **status**

> Members can also add tasks, but only inside projects they're on — and those
> tasks are automatically assigned to themselves and flagged as
> *member-generated*.

### 2b. Generate tasks from a brief with AI

Instead of typing every task, a PM can let AI do the first draft:

1. **Upload the brief** — a PDF or Word (`.docx`) document describing the project.
2. **Generate** — autom8 reads the document and drafts **5–20 concrete tasks**,
   each with a suggested category (Frontend, Backend, Design, QA, DevOps,
   Research, Other) and priority.
3. **Review & assign** — the PM checks the drafts, edits anything, removes what
   isn't needed, and assigns people.
4. **Add to board** — the approved tasks appear alongside everything else.

However a task is created, it gets a short **key** like `AUT-12` so it's easy to
refer to. If the project is linked to a GitHub repo, autom8 also opens a matching
**GitHub issue** for the task automatically.

---

## Step 3 — A team member works the task

A **member** opens the task board and finds the task assigned to them. New tasks
start as **Pending**.

- When they begin, the task moves to **In-progress**.
- As they write code and push commits to GitHub, those commits can be linked back
  to the task automatically, so the task shows a trail of the work behind it.

The board makes this easy to follow: tasks are grouped by status (*Pending*,
*In-progress*, *Completed*), and you can search by task name, person, or project.

---

## Step 4 — Finishing the task

A task reaches **Completed** in any of these ways:

- **Tick it off on the board** — check the box next to the task. (The assignee can
  always check off their own work.)
- **Mark it Completed** in the task's edit dialog.
- **Close the linked GitHub issue** — if a commit or pull request closes the
  issue (for example with the words `fixes #12`), autom8 flips the task to
  Completed on its own.

Every one of these actions is recorded in the **activity feed**, so there's always
a clear history of who did what and when.

---

## Step 5 — The daily wrap-up (Discord)

You don't have to assemble a status report by hand. **Once a day (around 5 PM
WIB)**, autom8 automatically posts a summary to your team's **Discord** channel
containing:

- ✅ the **tasks completed** that day, and
- 📦 the **commits pushed**, grouped by project and by division (Frontend,
  Backend, and so on).

It's a one-glance picture of the day's progress — no one has to write it.

---

## Quick glossary

- **Project** — a body of work for a client, owned by a PM and linked to a GitHub
  repo.
- **Task** — a single, shippable unit of work inside a project.
- **`AUT-N` key** — the short handle for a task (e.g. `AUT-12`), used everywhere to
  refer to it.
- **Division** — the discipline a task belongs to: Frontend, Backend, Design, QA,
  DevOps, Research, or Other.
- **Status** — where a task is in its life: **Pending → In-progress → Completed**.
- **Priority** — how urgent a task is: **High**, **Medium**, or **Low**.
