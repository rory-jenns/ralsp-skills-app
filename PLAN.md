# Skills App — PLAN.md

## Purpose
This document specifies a minimal, practical spec for a Skills Management application that tracks teams, users, skill categories, skills, and projects that require skills. It includes required UI pages, CRUD operations, search and matching functionality, and seed data so the app can be started and tested immediately.

---

## Primary entities (data model)
- Team
    - id, name, description, created_at, updated_at
- User
    - id, name, email, avatar_url, title, team_id (nullable), location, bio, created_at, updated_at
- SkillCategory
    - id, name, description, created_at, updated_at
- Skill
    - id, name, category_id, description, tags, created_at, updated_at
- UserSkill (join)
    - id, user_id, skill_id, level (enum: beginner/intermediate/advanced/expert), years_experience, last_verified
- Project
    - id, name, summary, owner_id (user or team), required_skills: list of (skill_id, min_level), start_date, end_date, status, created_at, updated_at
- Assignments
    - project_id, user_id, role, assigned_on

Constraints:
- Skill.name is unique within a category.
- User.email unique.
- Project.required_skills stored as normalized join table ProjectSkill(project_id, skill_id, min_level).

---

## UX & Pages (required)
- Global header: app search (skills/users/projects), breadcrumbs, user menu.
- Dashboard (landing)
    - Quick metrics: #teams, #users, #skills, #projects
    - Top-needed skills (from active projects)
    - Recent hires/assignments
    - Gap analysis: open project roles vs available users
    - Quick actions: Add User, Add Skill, Create Project, Search

- Teams
    - List view: search & filter (by name, number of members)
    - Detail view: team members, skills coverage heatmap, team projects
    - Add / Edit / Delete forms
    - Bulk-add members (CSV import)

- Users
    - Directory: search (name/email), filter by team, filter by skill, sort by years_experience or last_verified
    - User profile page: contact info, team, list of skills with levels, projects assigned, availability
    - Add / Edit modal: select team (optional), skill tag picker (typeahead), set levels and years
    - Bulk operations: assign skill to multiple users

- Skill Categories
    - List, Add, Edit, Delete
    - Category detail lists skills in that category

- Skills
    - List with category filter, tag filter, popularity (how many users)
    - Add / Edit / Delete skill form: choose category, description, tags
    - Skill page: users who have this skill, projects that require it

- Projects
    - List: filter by status, owner, required skill
    - Project detail: required skills and min levels, assigned users, timeline, notes
    - Create / Edit project form: select required skills from skill-picker, set min_level per skill
    - Match suggestions: automated list of users who meet or partially meet required skills, ordered by match score

- Search
    - Unified search bar with result tabs: Users, Skills, Projects, Teams
    - Advanced search / filters (skill level, location, team)
    - Faceted results and export (CSV)

- Admin
    - Manage categories, global settings, import/export seeds
    - Activity log & audit trail for edits

---

## APIs & Actions (CRUD & useful endpoints)
- GET /api/dashboard
- CRUD for teams: GET/POST/PUT/DELETE /api/teams
- CRUD for users: GET/POST/PUT/DELETE /api/users
- CRUD for categories: /api/skill-categories
- CRUD for skills: /api/skills
- CRUD for projects: /api/projects
- Search: GET /api/search?q=&type=users|skills|projects
- Matching engine: POST /api/projects/{id}/match -> returns ranked users with match_score
- Bulk import: POST /api/import (CSV/JSON)

Client operations:
- Typeahead endpoints for skill-picker: GET /api/skills?query=
- Suggest new skill when not found, optionally auto-create under selected category
- Connect user to skill: POST /api/users/{id}/skills

---

## Workflows / UX details
- Add new record convenience:
    - Inline “+ Add Skill” from user edit form (opens minimal modal to create skill + category).
    - Skill-picker supports creation on-the-fly and linking.
    - CSV import templates for users and skills with mapping UI.
- Linking:
    - When creating a project, add required skills via multi-select; show existing users who meet each requirement during creation.
    - From skill page, “Add user with this skill” quick button pre-fills user add form with selected skill.
- Matching logic:
    - Score calculated from levels, years_experience, recency (last_verified), and role fit.
    - Partial matches shown with missing skill indicators.
- Permissions:
    - Roles: admin, manager, user. Managers can edit their team and projects; admins full access.

---

## Seed data (dummy records)
- Teams (3)
    - Core Platform
    - Frontend Guild
    - Data Science

- Skill Categories (4)
    - Python
    - Web Development
    - DevOps
    - Data Engineering

- Skills (22)
    - Python: Django, Flask, FastAPI, Pandas, NumPy, PyTest
    - Web Development: React, Vue.js, Angular, TypeScript, HTML/CSS, Next.js
    - DevOps: Kubernetes, Docker, Terraform, Ansible, CI/CD, Prometheus
    - Data Engineering: Elasticsearch, Kafka, Airflow, Spark

- Users (10)
    - Alice Rivera — alice@example.com — Core Platform — skills: Django (advanced), Docker (intermediate), Kubernetes (intermediate)
    - Ben Cho — ben@example.com — Frontend Guild — skills: React (expert), TypeScript (expert), HTML/CSS (expert), Next.js (intermediate)
    - Carla Gomez — carla@example.com — Data Science — skills: Pandas (expert), NumPy (expert), Spark (intermediate)
    - Daniel Li — daniel@example.com — Core Platform — skills: Flask (intermediate), Terraform (intermediate), CI/CD (intermediate)
    - Erica Patel — erica@example.com — Frontend Guild — skills: Vue.js (advanced), Angular (intermediate), JavaScript/HTML/CSS (expert)
    - Frank Müller — frank@example.com — Core Platform — skills: Kubernetes (advanced), Prometheus (intermediate), Ansible (intermediate)
    - Grace Kim — grace@example.com — Data Science — skills: Elasticsearch (advanced), Kafka (intermediate), Airflow (intermediate)
    - Hugo Santos — hugo@example.com — (no team) — skills: FastAPI (advanced), PyTest (advanced), Docker (advanced)
    - Isha Kapoor — isha@example.com — Frontend Guild — skills: React (advanced), TypeScript (advanced), Next.js (advanced)
    - Joel Park — joel@example.com — Core Platform — skills: Terraform (advanced), Ansible (advanced), CI/CD (advanced)

- Projects (4)
    - Search 2.0
        - summary: Replace search infra with new stack
        - required_skills: Elasticsearch (expert), React (intermediate), Django (intermediate), Kubernetes (intermediate)
        - owner: Data Science
        - status: active
    - Realtime Analytics
        - summary: Stream and compute realtime metrics
        - required_skills: Kafka (advanced), Spark (advanced), Airflow (intermediate), Pandas (intermediate)
        - owner: Core Platform
        - status: planning
    - Customer Portal
        - summary: New customer-facing portal
        - required_skills: React (expert), TypeScript (expert), Django (intermediate), Docker (intermediate)
        - owner: Frontend Guild
        - status: active
    - Platform Infra Revamp
        - summary: Improve infra as code and observability
        - required_skills: Terraform (advanced), Kubernetes (advanced), Prometheus (intermediate), Ansible (intermediate)
        - owner: Core Platform
        - status: backlog

---

## Acceptance criteria
- CRUD pages and APIs exist for all entities.
- Seed data is loaded and visible in lists and detail pages.
- Users can be added and assigned skills and teams from the user form.
- Projects can be created with required skills and min levels.
- Match engine returns ranked candidate lists for a project.
- Search returns relevant results for users, skills, projects, and teams.

---

## Minimal MVP priorities (in order)
1. Data model, API CRUD, web UI lists and forms for Users, Skills, Projects.
2. Skill-picker that can create skills inline and link existing ones.
3. Project creation with required skills and basic match suggestion.
4. Dashboard with top-needed skills and quick actions.
5. Bulk import/export and role-based permissions.

---

## Notes & extensibility
- Add endorsements, verified-by, certifications later.
- Consider tagging skills with maturity and cross-category synonyms.
- Export match reports for project owners: CSV with match scores and gaps.

This spec is intentionally pragmatic: implement the data model and the UI patterns above, seed with the provided dummy records, and iterate on matching and UX improvements.