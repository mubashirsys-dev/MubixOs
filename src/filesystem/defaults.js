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

  // Pictures directory is created clean and empty for user media.

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
      theme: 'light',
      wallpaper: '/bg.png',
      performanceTier: 'auto',
      fontSize: 14,
      animations: true,
    }, null, 2)
  );
}
