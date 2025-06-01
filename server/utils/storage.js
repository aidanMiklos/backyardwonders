const { Storage } = require('@google-cloud/storage');
const path = require('path');
const crypto = require('crypto');

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

const generateSafeFileName = (originalName) => {
  // Get file extension
  const ext = path.extname(originalName);
  
  // Generate a random hash
  const hash = crypto.randomBytes(8).toString('hex');
  
  // Create a safe filename: timestamp-hash.extension
  return `${Date.now()}-${hash}${ext}`;
};

const uploadImage = async (file) => {
  if (!file) return null;
  
  // If storage is not initialized, return a placeholder URL
  if (!storage || !bucket) {
    console.warn('Storage not initialized. Returning placeholder URL.');
    return `https://via.placeholder.com/300?text=Image`;
  }

  try {
    // Generate a safe filename
    const safeFileName = generateSafeFileName(file.originalname);
    const filePath = `wonders/${safeFileName}`;
    
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000' // Cache for 1 year
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Error uploading to Google Cloud Storage:', error);
        // Return a more generic placeholder on error
        resolve(`https://via.placeholder.com/300?text=Image`);
      });
      
      blobStream.on('finish', async () => {
        try {
          // Make the file public
          await blob.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          resolve(`https://via.placeholder.com/300?text=Image`);
        }
      });

      // Write the file data to the stream
      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return `https://via.placeholder.com/300?text=Image`;
  }
};

module.exports = { uploadImage }; 