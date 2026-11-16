import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(distDir);
const jsFiles = files.filter(f => f.endsWith('.js'));

const reviewKeywords = [
  'ReviewPersonaPicker',
  'ReviewModeBanner',
  'SHEERWOOD_REVIEW_SESSION',
  'review_persona',
  'Active Review Persona'
];

// Check for real secrets / sensitive tokens
const suspiciousPatterns = [
  /OPENAI_API_KEY/i,
  /EASEBUZZ_KEY/i,
  /EASEBUZZ_SALT/i,
  /aws_secret_access_key/i,
  /BEGIN (RSA|EC|PRIVATE) KEY/,
  /sk-[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{20,}/
];

let hasReviewLeak = false;
let hasSecretLeak = false;

for (const jsFile of jsFiles) {
  const content = fs.readFileSync(jsFile, 'utf8');
  for (const kw of reviewKeywords) {
    if (content.includes(kw)) {
      console.error(`[FAIL] Review keyword "${kw}" found in ${path.basename(jsFile)}`);
      hasReviewLeak = true;
    }
  }
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      console.error(`[FAIL] Suspicious secret pattern "${pattern}" found in ${path.basename(jsFile)}`);
      hasSecretLeak = true;
    }
  }
}

if (!hasReviewLeak) {
  console.log('[PASS] Test 5: Review mode & persona picker are completely tree-shaken from dist/');
}

if (!hasSecretLeak) {
  console.log('[PASS] Secret Scan: No API secrets, private keys, or tokens found in dist/');
}
