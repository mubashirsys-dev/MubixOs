# Changelog

All notable changes to the **MUBIX OS LITE** project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-05-26
*Initial Public Release of MUBIX OS LITE — "The Future OS for Old Machines"*

### Added
- **Core Boot System**: Instant splash screen with circuit drawing vector animations, interactive power button, and loading diagnostics.
- **Window Management System**: Complete custom system enabling draggable, resizable, stackable, and fullscreen window structures with active z-index focus styling.
- **Virtual Filesystem (VFS)**: Persistent file structures stored within Browser LocalStorage with support for standard directories.
- **Application Ecosystem**:
  - `Notepad`: Text editing and VFS integration.
  - `Calculator`: Lightweight utility.
  - `Terminal`: Command-line interface with native commands (`help`, `ls`, `cat`, `clear`, `perf`).
  - `Browser`: Sandboxed iframe-based browsing.
  - `Code Editor`: Tech-grade code editor for writing scripts.
  - `File Manager`: Visual directory explorer for the VFS.
  - `Settings`: Control themes, wallpaper, and performance profiles.
- **Branding & Theme Engine**: Implementation of the signature **cream, purple, and coral** geometric visual identity.
- **Performance Profiler**: Dynamic setting options to toggle background animations and adjust rendering tiers (Tier 1, Tier 2, Tier 3) depending on system resources.

### Fixed
- Optimizations for DOM rendering speed to support legacy dual-core laptops with less than 2GB memory.
- Standardized CSS animations to prevent repainting lags in older browser engines.
