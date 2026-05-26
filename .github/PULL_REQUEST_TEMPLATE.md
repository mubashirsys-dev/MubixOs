### 🛠️ Description of Changes
Provide a detailed explanation of the changes made, their implementation details, and the technical decisions taken.

### 🔗 Related Issues
Closes # (issue number)

### ⚡ Performance & Low-End Machine Optimization Checklist
Please verify the performance impact of your PR on older devices:
- [ ] **Memory Footprint Checked**: Memory usage does not leak or exceed baseline metrics during runtime.
- [ ] **Zero Unnecessary Renders**: DOM manipulations are minimal, batched, or throttled.
- [ ] **Asset Size Minimization**: All added icons/assets are compressed SVGs or lightweight files.
- [ ] **CSS over JS**: Transitions and animations are built using optimized hardware-accelerated CSS where possible.

### 🧪 Verification & Testing
Describe the tests you ran to verify your changes:
1. **Browsers tested on**:
   - [ ] Chrome / Chromium (Desktop)
   - [ ] Firefox (Desktop)
   - [ ] Safari (if applicable)
   - [ ] Low-End Device Emulation (CPU throttling set to 4x/6x slowdown in DevTools)
2. **Behavior Verification**:
   - [ ] Window dragging/resizing remains smooth.
   - [ ] Keyboard navigation and accessibility focus works.
   - [ ] Virtual Filesystem persistence is functional.

### 🚀 Pull Request Checklist
- [ ] My code follows the code style guidelines of this project.
- [ ] I have verified the changes do not break the main build (`npm run build` compiles successfully).
- [ ] I have updated the documentation / CHANGELOG if necessary.
- [ ] My commits follow the **Semantic Commit** formatting rules (e.g. `feat(window-manager): add minimized state animations`).
