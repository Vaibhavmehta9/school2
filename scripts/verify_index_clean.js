import fs from 'node:fs';

const html = fs.readFileSync('dist/index.html', 'utf8');

const violations = [];
if (html.includes('vite.svg')) violations.push('Found vite.svg');
if (html.includes('Vite + React')) violations.push('Found Vite + React');
if (!html.includes('Sherwood College, Nainital | Admissions 2027-28')) violations.push('Missing updated Title');
if (!html.includes('name="description"')) violations.push('Missing meta description');
if (!html.includes('rel="canonical"')) violations.push('Missing canonical link');
if (!html.includes('name="theme-color"')) violations.push('Missing theme-color');
if (!html.includes('rel="manifest"')) violations.push('Missing manifest link');
if (!html.includes('application/ld+json')) violations.push('Missing JSON-LD');

if (violations.length === 0) {
  console.log('PASS: dist/index.html is 100% clean of Vite defaults and contains all required branding/SEO elements!');
} else {
  console.error('FAIL:', violations);
  process.exit(1);
}

