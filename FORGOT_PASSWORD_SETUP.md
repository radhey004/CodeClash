# Forgot Password Feature - Setup Guide

## Overview
The forgot password feature has been successfully added to CodeClash. Users can now reset their password via email.

## Features Added

### Backend
- **Password reset token generation** with 1-hour expiration
- **Email sending** using Nodemailer with Gmail
- **Secure token verification** using crypto hashing
- **New API endpoints:**
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/reset-password/:token` - Reset password with token

### Frontend
- **Forgot Password page** (`/forgot-password`) - Users enter email to receive reset link
- **Reset Password page** (`/reset-password/:token`) - Users set new password
- **Updated Login page** - Added "Forgot Password?" link
- **Password visibility toggle** on reset password page

## Email Configuration Setup

### 1. Using Gmail (Recommended for Development)

#### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification"
3. Follow the steps to enable it

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Click "Generate"
4. Copy the 16-character password (without spaces)

#### Step 3: Configure Environment Variables
Create a `.env` file in the `backend` directory:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
FRONTEND_URL=https://gocodeclash.vercel.app/
```

### 2. Using Other Email Providers

For other providers (Outlook, Yahoo, etc.), update the transporter configuration in `backend/controllers/authController.js`:

```javascript
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};
```

## How It Works

### User Flow
1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System generates a secure reset token
4. Email is sent with reset link (valid for 1 hour)
5. User clicks link and is redirected to reset password page
6. User enters new password (minimum 6 characters)
7. Password is updated, tokens are cleared
8. User is redirected to login page

### Security Features
- Reset tokens are hashed before storing in database
- Tokens expire after 1 hour
- Password validation (minimum 6 characters)
- Password confirmation matching
- Invalid/expired token handling

## Testing the Feature

### Local Testing
1. Ensure MongoDB is running
2. Configure email settings in `.env`
3. Start backend server:
   ```bash
   cd backend
   npm start
   ```
4. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```
5. Navigate to `https://gocodeclash.vercel.app/login`
6. Click "Forgot Password?"
7. Enter a registered email
8. Check your email inbox for reset link
9. Click link and set new password

### Email Template Preview
The reset email includes:
- Personalized greeting with username
- Clear call-to-action button
- Plain text link as backup
- 1-hour expiration notice
- CodeClash branding

## Troubleshooting

### Email Not Sending
- ✅ Check `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
- ✅ Verify 2-Step Verification is enabled (Gmail)
- ✅ Use App Password, not regular password (Gmail)
- ✅ Check spam/junk folder
- ✅ View server console for error logs

### Token Invalid/Expired
- ✅ Tokens expire after 1 hour
- ✅ Tokens can only be used once
- ✅ Request a new reset link if expired

### Frontend Issues
- ✅ Ensure `VITE_API_URL` environment variable is set
- ✅ Check browser console for errors
- ✅ Verify backend server is running

## File Changes

### Modified Files
- `backend/models/User.js` - Added reset token fields
- `backend/controllers/authController.js` - Added reset controllers
- `backend/routes/authRoutes.js` - Added reset routes
- `frontend/pages/Login.tsx` - Added forgot password link
- `frontend/App.tsx` - Added new routes

### New Files
- `frontend/pages/ForgotPassword.tsx` - Forgot password page
- `frontend/pages/ResetPassword.tsx` - Reset password page
- `backend/.env.example` - Environment variables template
- `FORGOT_PASSWORD_SETUP.md` - This setup guide

## Production Deployment

For production deployment:
1. Use a professional email service (SendGrid, AWS SES, Mailgun)
2. Set `FRONTEND_URL` to your production domain
3. Use strong `JWT_SECRET`
4. Enable HTTPS/SSL for email transmission
5. Consider rate limiting on reset endpoints
6. Monitor email sending logs

## Support
For issues or questions, check:
- Server console logs for detailed errors
- Email provider documentation
- Network tab in browser DevTools
