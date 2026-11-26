const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'src', 'data', 'seedData.ts');
let seedContent = fs.readFileSync(seedPath, 'utf8');

const demoProductIds = [
  'prod-course-1',
  'prod-course-2',
  'prod-course-3',
  'prod-course-4',
  'prod-course-5',
  'prod-course-6',
  'prod-course-7',
  'prod-ebook-1',
  'prod-ebook-2',
  'prod-ebook-3',
  'prod-tpl-1',
  'prod-tpl-2',
  'prod-tk-1',
  'prod-tk-2',
  'prod-sw-1',
  'prod-sw-2',
  'prod-sw-3',
];

const demoBlogIds = [
  'blog-1',
  'blog-2',
  'blog-3',
  'blog-4',
  'blog-5',
  'blog-6',
  'blog-7',
];

const demoEventIds = [
  'evt-1',
  'evt-2',
  'evt-3',
];

let modifiedCount = 0;

// Modify demo products in seedData.ts
for (const id of demoProductIds) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?status:\\s*)'published'`, 'g');
  if (pattern.test(seedContent)) {
    seedContent = seedContent.replace(pattern, "$1'draft'");
    modifiedCount++;
  }
}

// Modify demo blogs in seedData.ts
for (const id of demoBlogIds) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?status:\\s*)'published'`, 'g');
  if (pattern.test(seedContent)) {
    seedContent = seedContent.replace(pattern, "$1'draft'");
    modifiedCount++;
  }
}

// Modify demo events in seedData.ts
for (const id of demoEventIds) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?status:\\s*)'published'`, 'g');
  if (pattern.test(seedContent)) {
    seedContent = seedContent.replace(pattern, "$1'draft'");
    modifiedCount++;
  }
}

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log(`Updated seedData.ts: ${modifiedCount} demo items changed to status: 'draft'`);

// Also update storageService.ts for tutorials
const storagePath = path.join(__dirname, '..', 'src', 'services', 'storageService.ts');
let storageContent = fs.readFileSync(storagePath, 'utf8');

const demoTutorialIds = [
  'tut-ai-agents-automation',
  'tut-vibe-coding',
  'tut-apps-deployment',
  'tut-leadership',
];

let tutCount = 0;
for (const id of demoTutorialIds) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?status:\\s*)'published'`, 'g');
  if (pattern.test(storageContent)) {
    storageContent = storageContent.replace(pattern, "$1'draft'");
    tutCount++;
  }
}

fs.writeFileSync(storagePath, storageContent, 'utf8');
console.log(`Updated storageService.ts: ${tutCount} demo tutorials changed to status: 'draft'`);
