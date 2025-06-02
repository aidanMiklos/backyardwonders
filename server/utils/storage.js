const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');

// Initialize storage with credentials
let storage = null;
let bucket = null;

const initializeStorage = () => {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_BUCKET || !process.env.GOOGLE_CLOUD_KEYFILE) {
      console.warn('Missing required Google Cloud configuration. Image upload will be disabled.');
      return;
    }

    // Decode base64 keyfile content
    const keyfileContent = Buffer.from(process.env.GOOGLE_CLOUD_KEYFILE, 'base64').toString();
    const credentials = JSON.parse(keyfileContent);

    storage = new Storage({ 
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials
    });

    if (storage) {
      bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);
      console.log('Google Cloud Storage initialized successfully');
      console.log('- Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
      console.log('- Bucket:', process.env.GOOGLE_CLOUD_BUCKET);
      console.log('- Service Account:', credentials.client_email);
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
      if (!storage || !bucket) {
        console.error('Storage not initialized');
        return 'https://placehold.co/300x300?text=Storage+Not+Initialized';
      }
  
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
  
        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${safeFilename}`;
          resolve(publicUrl);
        });
  
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return 'https://placehold.co/300x300?text=Error';
    }
  };

module.exports = { uploadImage };
