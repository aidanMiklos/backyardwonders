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

const generateSafeFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop().toLowerCase();
  return `${timestamp}-${randomString}.${extension}`;
};

const uploadImage = async (file) => {
  try {
    if (!file || !file.buffer) {
      console.error('Invalid file object');
      return 'https://placehold.co/300x300?text=No+Image';
    }

    const safeFilename = generateSafeFilename(file.originalname);
    const blob = bucket.file(safeFilename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to GCS:', error);
        resolve('https://placehold.co/300x300?text=Upload+Error');
      });

      blobStream.on('finish', async () => {
        try {
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${safeFilename}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          resolve('https://placehold.co/300x300?text=Access+Error');
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return 'https://placehold.co/300x300?text=Error';
  }
};

module.exports = { uploadImage };
