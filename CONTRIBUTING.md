# Contributing to MUBIX OS LITE

Welcome! We are excited that you want to contribute to **MUBIX OS LITE** — *The Future OS for Old Machines*. Whether you are fixing bugs, writing new apps, improving the virtual filesystem, or optimizing boot performance, your help makes a big difference.

Please take a moment to read this guide before submitting code or proposing changes.

---

## 🎨 Design Philosophy & Principles

Mubix OS Lite is built with a specific set of constraints and goals in mind:
1. **Ultra-Lightweight & Performant**: Every line of code should be evaluated for its memory and rendering footprint. We avoid bloated npm libraries; we prefer pure, optimized Vanilla JS and CSS.
2. **Glassmorphic & Technical Aesthetic**: Our design features a signature cream, purple, and coral palette, featuring fine-line borders, high-fidelity diagnostic crosshairs, and geometric visual harmony.
3. **No Placeholders**: When building new apps or layouts, ensure features are fully functional.

---

## 🏗️ Codebase Architecture Overview

Our structure is modular and scalable. Please stick to these boundaries:
```txt
src/
├── apps/             # Browser-based apps (notepad, calculator, terminal, etc.)
├── core/             # Boot orchestrator, configuration engine, and global state
├── filesystem/       # Virtual File System (VFS) and storage persistence layers
├── kernel/           # Process scheduling, system interrupts, and memory management
├── services/         # Shared APIs (audio, networking, clock, window positioning)
├── styles/           # Design tokens, resets, window layouts, and themes
├── ui/               # Reusable UI widgets (menus, taskbar/dock, widgets)
├── utils/            # Helper logic and formatting tools
└── window-system/    # Draggable, resizable, focus, and fullscreen window management
```

---

## 🚀 Setting Up the Development Workspace

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/mubixOs.git
   cd mubixOs
   ```
2. **Install Dev Dependencies**:
   ```bash
   npm install
   ```
3. **Boot Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 📝 Coding Standards & Patterns

* **ES6+ Modules**: We use native ECMAScript Modules (`import` and `export`).
* **CSS Class Names**: Use custom BEM-like or scoped styles to avoid layout interference. Style rules should reside in the app/component's own stylesheet (e.g. `src/apps/notepad/style.css`).
* **Vite Path Aliases**: Always use defined import paths in `vite.config.js`:
  - `@core/*` points to `src/core/*`
  - `@apps/*` points to `src/apps/*`
  - `@styles/*` points to `src/styles/*`
  - `@ws/*` points to `src/window-system/*`

---

## 📜 Semantic Commit Message Format

We enforce **semantic commits** to automatically manage versioning and generate changelogs. Commits should match this structure:

```txt
<type>(<scope>): <short description>
```

### Allowed Types:
* `feat`: A new user-facing feature or application (e.g. `feat(terminal): add network utilities`)
* `fix`: A bug fix or layout correction (e.g. `fix(window-manager): resolve bounds on window resize`)
* `docs`: Documentation updates (e.g. `docs(readme): add performance benchmark graphs`)
* `style`: Styling adjustments, formatting, colors (e.g. `style(dock): refine coral focus highlights`)
* `perf`: Performance tuning and memory optimization (e.g. `perf(vfs): cache folder lookups`)
* `refactor`: Restructuring code without changing behavior (e.g. `refactor(boot): modularize loading sequences`)

---

## 📦 Versioning Strategy

We follow [Semantic Versioning (SemVer)](https://semver.org/):
* **MAJOR** (`vX.0.0`): Incompatible system/API changes (e.g. redesigning the core runtime system).
* **MINOR** (`v0.Y.0`): Adding features or new apps in a backwards-compatible manner.
* **PATCH** (`v0.0.Z`): Backwards-compatible bug fixes or styling adjustments.

---

## 📥 Submitting a Pull Request

1. Create a branch named after your feature: `git checkout -b feat/your-feature-name` or `git checkout -b fix/issue-name`.
2. Verify that the build completes successfully: `npm run build`.
3. Push changes to your fork and submit a PR against our `main` branch.
4. Ensure the **Pull Request Template** is filled out with performance checkpoints completed.
