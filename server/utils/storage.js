const { Storage } = require('@google-cloud/storage');
const path = require('path');
const crypto = require('crypto');

// Initialize storage with credentials
let storage = null;
let bucket = null;

const initializeStorage = () => {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_BUCKET) {
      console.warn('Missing required Google Cloud configuration. Image upload will be disabled.');
      return;
    }

    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
      });
    } else {
      const keyfilePath = path.join(__dirname, '..', process.env.GOOGLE_CLOUD_KEYFILE || 'credentials/keyfile.json');
      try {
        storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: keyfilePath,
        });
        console.log('Using keyfile from:', keyfilePath);
      } catch (error) {
        console.warn(`Could not find keyfile at ${keyfilePath}. Image upload will be disabled.`);
        console.error('Storage initialization error:', error);
        return;
      }
    }

    if (storage) {
      bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);
      console.log('Google Cloud Storage initialized successfully');
      console.log('- Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
      console.log('- Bucket:', process.env.GOOGLE_CLOUD_BUCKET);
    }
  } catch (error) {
    console.error('Error initializing Google Cloud Storage:', error);
    storage = null;
    bucket = null;
  }
};

initializeStorage();

// Generate SHA-256 hash of file buffer
const hashBuffer = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const uploadImage = async (file) => {
  if (!file) return null;

  if (!storage || !bucket) {
    console.warn('Storage not initialized. Returning placeholder URL.');
    return `https://via.placeholder.com/300?text=Image`;
  }

  try {
    const fileHash = hashBuffer(file.buffer);
    const ext = path.extname(file.originalname);
    const filePath = `wonders/${fileHash}${ext}`;
    const blob = bucket.file(filePath);

    // Check if file already exists
    const [exists] = await blob.exists();
    if (exists) {
      console.log('Duplicate image detected. Skipping upload.');
      return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to Google Cloud Storage:', error);
        resolve(`https://via.placeholder.com/300?text=Image`);
      });

      blobStream.on('finish', async () => {
        try {
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          resolve(`https://via.placeholder.com/300?text=Image`);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return `https://via.placeholder.com/300?text=Image`;
  }
};

module.exports = { uploadImage };
