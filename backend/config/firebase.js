import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    // Don't exit, but log the error
  }
} else {
  console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not set — social login will not work');
  console.warn('   Make sure FIREBASE_SERVICE_ACCOUNT is set in your .env file');
}

export default admin;
