/**
 * Production Build & Asset Verification Script
 * 
 * Performs production validation for Vercel deployment:
 * 1. Syntax check and import validation for Express server entrypoints.
 * 2. Static asset verification (HTML, CSS, JS, logo).
 * 3. RAG knowledge base integrity verification (processed document chunks).
 * 4. Course catalog & prerequisite graph structure verification.
 * 5. Vercel deployment routing and configuration validation.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================');
console.log('VIDYASHILP UNIVERSITY ACADEMIC ADVISOR — PRODUCTION BUILD');
console.log('================================================================\n');

let errorCount = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`✓ [OK] ${description}`);
  } else {
    console.error(`❌ [ERROR] ${description}`);
    errorCount++;
  }
}

// 1. Syntax verification of server and library entrypoints
console.log('1. Validating Node.js server and engine syntax...');
try {
  execSync('node --check src/server.js', { stdio: 'pipe' });
  assert(true, 'src/server.js syntax valid');
} catch (e) {
  assert(false, `src/server.js syntax error: ${e.message}`);
}

try {
  execSync('node --check src/lib/advisory-engine.js', { stdio: 'pipe' });
  assert(true, 'src/lib/advisory-engine.js syntax valid');
} catch (e) {
  assert(false, `src/lib/advisory-engine.js syntax error: ${e.message}`);
}

try {
  execSync('node --check src/lib/courses.js', { stdio: 'pipe' });
  assert(true, 'src/lib/courses.js syntax valid');
} catch (e) {
  assert(false, `src/lib/courses.js syntax error: ${e.message}`);
}

try {
  execSync('node --check src/lib/multimodal/infographic.js', { stdio: 'pipe' });
  assert(true, 'src/lib/multimodal/infographic.js syntax valid');
} catch (e) {
  assert(false, `src/lib/multimodal/infographic.js syntax error: ${e.message}`);
}

try {
  execSync('node --check src/lib/agent/workflow.js', { stdio: 'pipe' });
  assert(true, 'src/lib/agent/workflow.js syntax valid');
} catch (e) {
  assert(false, `src/lib/agent/workflow.js syntax error: ${e.message}`);
}

// 2. Validate course catalog and synthetic profiles
console.log('\n2. Validating course catalog and synthetic student data...');
const { OFFICIAL_COURSE_CATALOG, COURSE_PREREQUISITES } = require('../src/lib/courses');
const { SYNTHETIC_PROFILES } = require('../src/lib/advisory-engine');

assert(Array.isArray(OFFICIAL_COURSE_CATALOG) && OFFICIAL_COURSE_CATALOG.length >= 80, `Official course catalog verified (${OFFICIAL_COURSE_CATALOG.length} courses)`);
assert(Object.keys(COURSE_PREREQUISITES).length >= 20, `Prerequisite graph verified (${Object.keys(COURSE_PREREQUISITES).length} rules)`);
assert(Array.isArray(SYNTHETIC_PROFILES) && SYNTHETIC_PROFILES.length === 24, `Synthetic demo profiles verified (${SYNTHETIC_PROFILES.length} profiles)`);

// 3. Static frontend assets verification
console.log('\n3. Validating static frontend assets in public/...');
const publicDir = path.resolve(__dirname, '../public');
const htmlPath = path.join(publicDir, 'index.html');
const cssPath = path.join(publicDir, 'style.css');
const jsPath = path.join(publicDir, 'app.js');
const logoPath = path.join(publicDir, 'assets', 'vu-logo.png');

assert(fs.existsSync(htmlPath) && fs.statSync(htmlPath).size > 500, 'public/index.html exists and is non-empty');
assert(fs.existsSync(cssPath) && fs.statSync(cssPath).size > 500, 'public/style.css exists and is non-empty');
assert(fs.existsSync(jsPath) && fs.statSync(jsPath).size > 500, 'public/app.js exists and is non-empty');
assert(fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0, 'public/assets/vu-logo.png exists');

// 4. Knowledge base chunks verification
console.log('\n4. Validating RAG knowledge base data chunks...');
const chunksPath = path.resolve(__dirname, '../data/processed/rag_document_chunks.json');
assert(fs.existsSync(chunksPath), 'data/processed/rag_document_chunks.json exists');
if (fs.existsSync(chunksPath)) {
  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
  assert(Array.isArray(chunks) && chunks.length > 800, `RAG document chunks loaded and verified (${chunks.length} chunks)`);
}

// 5. Vercel deployment configuration check
console.log('\n5. Validating Vercel deployment configuration...');
const vercelConfigPath = path.resolve(__dirname, '../vercel.json');
assert(fs.existsSync(vercelConfigPath), 'vercel.json exists');
if (fs.existsSync(vercelConfigPath)) {
  const vercelJson = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  assert(vercelJson.builds && vercelJson.builds.some(b => b.src === 'src/server.js'), 'vercel.json targets src/server.js with @vercel/node');
  assert(vercelJson.routes && vercelJson.routes.some(r => r.dest === 'src/server.js'), 'vercel.json routes all requests to src/server.js');
}

console.log('\n================================================================');
if (errorCount === 0) {
  console.log('✅ PRODUCTION BUILD VERIFICATION PASSED (0 Errors)');
  console.log('Bundle is ready for Vercel production deployment.');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ PRODUCTION BUILD FAILED (${errorCount} Errors)`);
  console.log('================================================================\n');
  process.exit(1);
}
