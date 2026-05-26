# Security Policy

## Supported Versions

We actively maintain and support security patches for the following versions of **MUBIX OS LITE**:

| Version | Supported |
| ------- | --------- |
| v1.0.x  | Yes       |
| < v1.0  | No        |

---

## Reporting a Vulnerability

Because Mubix OS Lite runs as a web-based operating system inside user browsers, local security and sandboxing are critical. If you discover a security vulnerability (such as Cross-Site Scripting, prototype pollution, virtual file system directory traversal, or memory leakage), please report it to us immediately.

### 📬 How to Report
Please do **not** open a public GitHub issue for security vulnerabilities. Instead, send a detailed report to:
- **Email**: mubashir.sys@gmail.com

In your report, please include:
1. A descriptive title and type of vulnerability (e.g. "VFS Directory Traversal via App Manifest").
2. Step-by-step instructions or a Proof of Concept (PoC) script to reproduce the issue.
3. The impact of the vulnerability (e.g., local storage exposure, system crash, arbitrary execution).
4. Any potential remediation ideas.

### 🕵️ Our Security Commitment
* We will acknowledge receipt of your report within 48 hours.
* We will send follow-up correspondence describing our validation findings and progress.
* Once verified, we will aim to patch the issue and publish a release within 7 days.
* Credit will be provided in our release notes / CHANGELOG to security researchers who report issues responsibly.
