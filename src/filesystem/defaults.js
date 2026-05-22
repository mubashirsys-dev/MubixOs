/* ═══════════════════════════════════════════
   MUBIX OS — Default Filesystem Structure
   Created on first boot.
   ═══════════════════════════════════════════ */

import vfs from '@fs/vfs.js';

export async function createDefaults() {
  // Check if already initialized
  if (await vfs.exists('/home')) return;

  // Create directory structure
  const dirs = [
    '/home',
    '/home/Desktop',
    '/home/Documents',
    '/home/Downloads',
    '/home/Pictures',
    '/system',
    '/system/apps',
    '/system/config',
    '/system/themes',
    '/tmp',
  ];

  for (const dir of dirs) {
    if (!(await vfs.exists(dir))) {
      await vfs.mkdir(dir);
    }
  }

  // Helper helper to write file if not existing
  const seedFile = async (path, content, mime = 'text/plain') => {
    if (!(await vfs.exists(path))) {
      await vfs.writeFile(path, content, mime);
    }
  };

  // Create some default files
  await seedFile('/home/Desktop/welcome.txt',
    `Welcome to MUBIX OS!\n\nThe Future OS for Old Machines.\n\nTry opening the Terminal and typing 'help' to see available commands.\n\nEnjoy your experience! 🚀`
  );

  await seedFile('/home/Documents/readme.md',
    `# MUBIX OS\n\n## Quick Start\n\n- Click apps in the dock to launch them\n- Right-click the desktop for options\n- Press Super key to open the launcher\n- Drag window titlebars to move them\n\n## Tips\n\n- Use the Terminal for advanced operations\n- Settings app lets you customize the experience\n- Files are saved locally in your browser`
  );

  // ── Seed Wallpapers / Photos ──
  await seedFile('/home/Pictures/neon_grid.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a051b"/>
      <stop offset="100%" stop-color="#05020c"/>
    </linearGradient>
    <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <g stroke="url(#gridGrad)" stroke-width="1.5">
    <path d="M 0,350 L 800,350 M 0,360 L 800,360 M 0,380 L 800,380 M 0,410 L 800,410 M 0,450 L 800,450 M 0,500 L 800,500 M 0,560 L 800,560"/>
    <path d="M 400,300 L 0,600 M 400,300 L 100,600 M 400,300 L 200,600 M 400,300 L 300,600 M 400,300 L 400,600 M 400,300 L 500,600 M 400,300 L 600,600 M 400,300 L 700,600 M 400,300 L 800,600"/>
  </g>
  <circle cx="400" cy="280" r="80" fill="#f43f5e" filter="blur(10px)" opacity="0.3"/>
  <text x="400" y="295" font-family="monospace" font-size="28" font-weight="900" fill="#a78bfa" text-anchor="middle" letter-spacing="4">NEON GRID</text>
</svg>`, 'image/svg+xml');

  await seedFile('/home/Pictures/cyber_sunset.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#02000a"/>
      <stop offset="50%" stop-color="#140a2b"/>
      <stop offset="100%" stop-color="#2d0a4e"/>
    </linearGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff007f"/>
      <stop offset="100%" stop-color="#ffaa00"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="400" cy="300" r="120" fill="url(#sun)"/>
  <g fill="#02000a">
    <rect x="250" y="320" width="300" height="4"/>
    <rect x="250" y="340" width="300" height="6"/>
    <rect x="250" y="365" width="300" height="8"/>
    <rect x="250" y="395" width="300" height="12"/>
    <rect x="250" y="430" width="300" height="18"/>
  </g>
  <g stroke="#3b82f6" stroke-width="1" opacity="0.4">
    <line x1="0" y1="450" x2="800" y2="450"/>
    <line x1="0" y1="470" x2="800" y2="470"/>
    <line x1="0" y1="500" x2="800" y2="500"/>
    <line x1="0" y1="540" x2="800" y2="540"/>
    <line x1="0" y1="590" x2="800" y2="590"/>
    <line x1="400" y1="430" x2="400" y2="600"/>
    <line x1="400" y1="430" x2="200" y2="600"/>
    <line x1="400" y1="430" x2="0" y2="600"/>
    <line x1="400" y1="430" x2="600" y2="600"/>
    <line x1="400" y1="430" x2="800" y2="600"/>
  </g>
  <text x="400" y="240" font-family="monospace" font-size="20" fill="#06b6d4" text-anchor="middle" letter-spacing="8">CYBER SUNSET</text>
</svg>`, 'image/svg+xml');

  await seedFile('/home/Pictures/matrix_os.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#000000"/>
  <g fill="#00ff66" font-family="monospace" font-size="12" opacity="0.75">
    <text x="40" y="50">10101011</text>
    <text x="40" y="80">011010</text>
    <text x="40" y="110">1001</text>
    <text x="120" y="80">010010110</text>
    <text x="120" y="120">110101</text>
    <text x="200" y="40">MUBIX</text>
    <text x="200" y="70">SYSTEMS</text>
    <text x="200" y="100">01010</text>
    <text x="280" y="90">11011001</text>
    <text x="360" y="60">0100</text>
    <text x="360" y="120">1101</text>
    <text x="440" y="40">OS</text>
    <text x="440" y="90">100110</text>
    <text x="520" y="110">011010101</text>
    <text x="600" y="70">ACTIVE</text>
    <text x="680" y="100">1010</text>
    <text x="740" y="50">000101</text>
  </g>
  <text x="400" y="300" font-family="monospace" font-size="32" font-weight="bold" fill="#00ff66" text-anchor="middle" letter-spacing="10">MATRIX OS</text>
</svg>`, 'image/svg+xml');

  // ── Seed Code Editor Files ──
  await seedFile('/home/Documents/welcome_code.js',
`/* 
  MUBIX OS — In-App Sandboxed JS Runner
  Edit this code, then press "⚡ Run" on the toolbar!
*/

function welcome() {
  console.log("Initializing local runtime...");
  console.log("Core modules: OK");
  console.log("Memory pressure: MINIMAL");
  
  const greeting = "Hello World from MUBIX OS sandbox!";
  return greeting;
}

// Execute the welcome function
const result = welcome();
console.log("Success:", result);
`
  );

  await seedFile('/home/Documents/dynamic_calculator.js',
`// Quick mathematical calculations inside Code Editor VFS
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const steps = 10;
console.log("Generating fibonacci sequence of " + steps + " steps...");
for (let i = 1; i <= steps; i++) {
  console.log("Step " + i + ": " + fibonacci(i));
}
console.log("Sequence complete.");
`
  );

  // ── Seed Media Files ──
  await seedFile('/home/Downloads/synthwave_loop.audio', 'synthwave_loop_data');
  await seedFile('/home/Downloads/cyberpunk_drive.audio', 'cyberpunk_drive_data');
  await seedFile('/home/Downloads/ambient_glitch.audio', 'ambient_glitch_data');

  await seedFile('/system/config/settings.json',
    JSON.stringify({
      theme: 'dark',
      wallpaper: 'mesh',
      performanceTier: 'auto',
      fontSize: 14,
      animations: true,
    }, null, 2)
  );
}
