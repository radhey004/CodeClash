import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Multer config — store in memory for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    const sanitized = username.trim();

    // Check if username is already taken
    const existing = await User.findOne({ username: sanitized, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    req.user.username = sanitized;
    await req.user.save();

    res.json({ username: req.user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary from buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'codeclash/avatars',
          public_id: `user_${req.user._id}`,
          overwrite: true,
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    req.user.avatar = result.secure_url;
    await req.user.save();

    res.json({ avatar: result.secure_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

// Support both PUT and POST in case a deployment proxy only forwards GET/POST.
router.put('/username', protect, updateUsername);
router.post('/username', protect, updateUsername);

// Support both PUT and POST in case a deployment proxy only forwards GET/POST.
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

// Get user by ID (public profile view)
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
