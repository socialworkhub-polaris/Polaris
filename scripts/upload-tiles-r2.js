/**
 * Uploads large PMTiles archives to Cloudflare R2 using AWS S3 Multipart Upload.
 * Usage: node scripts/upload-tiles-r2.js [filename]
 */
const fs = require('fs');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Load environment variables from .env.local if present
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'polarismapstorage';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('[R2 Upload] Missing R2 credentials in .env.local (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).');
  process.exit(1);
}

const fileName = process.argv[2] || 'germany.pmtiles';
const filePath = path.resolve(__dirname, '..', 'public', 'tiles', fileName);

if (!fs.existsSync(filePath)) {
  console.error(`[R2 Upload] File not found at: ${filePath}`);
  process.exit(1);
}

const stats = fs.statSync(filePath);
const totalMb = (stats.size / (1024 * 1024)).toFixed(1);
console.log(`[R2 Upload] Starting multipart upload of ${fileName} (${totalMb} MB) to bucket "${bucketName}"...`);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const fileStream = fs.createReadStream(filePath);

const upload = new Upload({
  client: s3,
  params: {
    Bucket: bucketName,
    Key: fileName,
    Body: fileStream,
    ContentType: 'application/octet-stream',
  },
  queueSize: 4, // 4 concurrent parts
  partSize: 20 * 1024 * 1024, // 20 MB parts
});

let lastLog = 0;
upload.on('httpUploadProgress', (progress) => {
  const now = Date.now();
  if (now - lastLog > 2000 || progress.loaded === stats.size) {
    lastLog = now;
    const pct = ((progress.loaded / stats.size) * 100).toFixed(1);
    const uploadedMb = (progress.loaded / (1024 * 1024)).toFixed(1);
    console.log(`[R2 Upload] Progress: ${pct}% (${uploadedMb} MB / ${totalMb} MB)`);
  }
});

upload
  .done()
  .then(() => {
    console.log(`[R2 Upload] SUCCESS! ${fileName} has been completely uploaded to Cloudflare R2.`);
    console.log(`[R2 Upload] Public URL: https://pub-f3f0eb63a5f147d589065f16773925a3.r2.dev/${fileName}`);
  })
  .catch((err) => {
    console.error('[R2 Upload] Upload failed with error:', err);
    process.exit(1);
  });
