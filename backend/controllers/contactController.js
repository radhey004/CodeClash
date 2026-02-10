import nodemailer from 'nodemailer';

// Store transporter instance
let transporter = null;
let transporterInitialized = false;

// Configure email transporter (called lazily on first use)
const getTransporter = () => {
  // Only initialize once
  if (transporterInitialized) {
    return transporter;
  }
  
  transporterInitialized = true;
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Debug logging
  console.log('🔍 Email Config Check:');
  console.log('  EMAIL_USER:', emailUser ? `✓ ${emailUser}` : '✗ Not set');
  console.log('  EMAIL_PASS:', emailPass ? '✓ Set' : '✗ Not set');

  // Remove spaces from app password (Gmail app passwords sometimes have spaces)
  const cleanPassword = emailPass ? emailPass.replace(/\s+/g, '') : '';

  if (!emailUser || !cleanPassword) {
    console.warn('⚠️  Email credentials not configured. Contact form will log messages to console.');
    return null;
  }
  
  console.log('✅ Email configured successfully for:', emailUser);

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: cleanPassword
    }
  });
  
  return transporter;
};

export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Get transporter (initialized lazily)
    const emailTransporter = getTransporter();

    // If email is not configured, log to console and return success
    if (!emailTransporter) {
      console.log('\n📧 ===== NEW CONTACT FORM SUBMISSION =====');
      console.log('Name:', name);
      console.log('Email:', email);
      console.log('Subject:', subject);
      console.log('Message:', message);
      console.log('Timestamp:', new Date().toISOString());
      console.log('========================================\n');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Message received! (Email not configured - check server console)' 
      });
    }

    // Email to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'radhey.k0017@gmail.com',
      subject: `CodeClash Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">New Contact Form Submission</h2>
          <hr style="border: 1px solid #e5e7eb;" />
          
          <h3 style="color: #374151;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          
          <h3 style="color: #374151;">Message:</h3>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="border: 1px solid #e5e7eb; margin-top: 20px;" />
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from the CodeClash contact form.
          </p>
        </div>
      `,
      replyTo: email
    };

    // Send email
    await emailTransporter.sendMail(mailOptions);

    // Optional: Send confirmation email to user
    const confirmationMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting CodeClash',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Thank You for Reaching Out!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Your Message:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p>Best regards,<br/>The CodeClash Team</p>
          
          <hr style="border: 1px solid #e5e7eb; margin-top: 20px;" />
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated confirmation email from CodeClash.
          </p>
        </div>
      `
    };

    await emailTransporter.sendMail(confirmationMail);

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! We\'ll get back to you soon.' 
    });

  } catch (error) {
    console.error('Error sending contact email:', error);
    
    // Log the message to console as fallback
    console.log('\n📧 ===== CONTACT FORM (EMAIL FAILED) =====');
    console.log('Name:', req.body.name);
    console.log('Email:', req.body.email);
    console.log('Subject:', req.body.subject);
    console.log('Message:', req.body.message);
    console.log('Error:', error.message);
    console.log('========================================\n');
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again or email us directly at radhey.k0017@gmail.com' 
    });
  }
};
