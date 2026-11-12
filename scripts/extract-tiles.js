/**
 * Extracts/downloads Berlin PMTiles using the pmtiles CLI or from remote source.
 * Usage: node scripts/extract-tiles.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'tiles');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'berlin.pmtiles');
const BIN_PATH = path.resolve(__dirname, 'bin', process.platform === 'win32' ? 'pmtiles.exe' : 'pmtiles');

// Berlin Bounding Box
const BERLIN_BBOX = '13.088,52.338,13.761,52.675';

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`[PMTiles] Berlin PMTiles already exists at: ${OUTPUT_FILE} (${sizeMb} MB)`);
    return;
  }

  if (!fs.existsSync(BIN_PATH)) {
    console.error(`[PMTiles] Error: pmtiles binary not found at ${BIN_PATH}.`);
    console.log('Please download go-pmtiles from https://github.com/protomaps/go-pmtiles/releases into scripts/bin/');
    process.exit(1);
  }

  console.log(`[PMTiles] Extracting Berlin bbox [${BERLIN_BBOX}] from latest Protomaps build...`);
  // Use today/yesterday build
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const remoteUrl = `https://build.protomaps.com/${dateStr}.pmtiles`;

  try {
    execSync(`"${BIN_PATH}" extract "${remoteUrl}" "${OUTPUT_FILE}" --bbox=${BERLIN_BBOX}`, {
      stdio: 'inherit',
    });
    console.log(`[PMTiles] Successfully generated ${OUTPUT_FILE}`);
  } catch (err) {
    console.warn(`[PMTiles] Could not extract from ${remoteUrl}, attempting fallback build...`);
    const fallbackUrl = 'https://build.protomaps.com/20261111.pmtiles';
    execSync(`"${BIN_PATH}" extract "${fallbackUrl}" "${OUTPUT_FILE}" --bbox=${BERLIN_BBOX}`, {
      stdio: 'inherit',
    });
    console.log(`[PMTiles] Successfully generated ${OUTPUT_FILE} via fallback build.`);
  }
}

main();
