/**
 * Download MediaPipe Models Script
 * Downloads required MediaPipe models to public/models directory
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, 'public', 'models');

const MODELS = [
  {
    name: 'blaze_face_short_range.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  },
  {
    name: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  },
];

/**
 * Download a file from URL
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    console.log(`Downloading: ${path.basename(destination)}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        file.close();
        fs.unlinkSync(destination);
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destination);
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\rProgress: ${progress}%`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`\n✓ Downloaded: ${path.basename(destination)}`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('MediaPipe Models Downloader\n');

  // Create models directory if it doesn't exist
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`Created directory: ${MODELS_DIR}\n`);
  }

  // Download each model
  for (const model of MODELS) {
    const destination = path.join(MODELS_DIR, model.name);

    // Check if file already exists
    if (fs.existsSync(destination)) {
      const stats = fs.statSync(destination);
      console.log(`✓ Already exists: ${model.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      continue;
    }

    try {
      await downloadFile(model.url, destination);
    } catch (error) {
      console.error(`\n✗ Failed to download ${model.name}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✓ All models downloaded successfully!');
  console.log('\nModels location:', MODELS_DIR);
  console.log('\nYou can now run: npm run dev');
}

// Run the script
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

