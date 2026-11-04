import { cp, mkdir } from 'node:fs/promises';

const standalone = '.next/standalone';
await mkdir(`${standalone}/.next`, { recursive: true });
await cp('.next/static', `${standalone}/.next/static`, { recursive: true });
await cp('public', `${standalone}/public`, { recursive: true });

console.log('Standalone server assets copied.');
