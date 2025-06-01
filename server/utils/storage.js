const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize storage with credentials
let storage = null;
let bucket = null;

const initializeStorage = () => {
  try {
    // Check for required environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_BUCKET) {
      console.warn('Missing required Google Cloud configuration. Image upload will be disabled.');
      return;
    }

    // In production, use credentials from environment variables
    if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
      storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
      });
    } 
    // In development, use local keyfile
    else {
      const keyfilePath = path.join(__dirname, '..', process.env.GOOGLE_CLOUD_KEYFILE || 'credentials/keyfile.json');
      try {
        storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: keyfilePath
        });
        console.log('Using keyfile from:', keyfilePath);
      } catch (error) {
        console.warn(`Could not find keyfile at ${keyfilePath}. Image upload will be disabled.`);
        console.error('Storage initialization error:', error);
        return;
      }
    }

    // Initialize bucket
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

// Initialize on startup
initializeStorage();

const uploadImage = async (file) => {
  if (!file) return null;
  
  // If storage is not initialized, return a placeholder URL
  if (!storage || !bucket) {
    console.warn('Storage not initialized. Returning placeholder URL.');
    return `https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`;
  }

  try {
    const blob = bucket.file(`wonders/${Date.now()}-${file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to Google Cloud Storage:', error);
        // Fallback to placeholder URL on error
        resolve(`https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`);
      });
      
      blobStream.on('finish', async () => {
        try {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error getting public URL:', error);
          // Fallback to placeholder URL on error
          resolve(`https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    // Fallback to placeholder URL on error
    return `https://via.placeholder.com/300?text=${encodeURIComponent(file.originalname)}`;
  }
};

module.exports = { uploadImage }; 