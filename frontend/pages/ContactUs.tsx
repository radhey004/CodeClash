import { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Github, Twitter, Linkedin, Send } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_COMPILER_URL}/api/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus('error');
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions, feedback, or suggestions? We'd love to hear from you. 
            Our team is here to help you with any inquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Information Cards */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
            <div className="bg-cyan-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Email Us</h3>
            <p className="text-gray-400 mb-2">
              Drop us a line anytime
            </p>
            <a href="mailto:support@codeclash.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              radhey.k0017@gmail.com
            </a>
          </div>

          

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
            <div className="bg-purple-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Location</h3>
            <p className="text-gray-400 mb-2">
              Visit our office
            </p>
            <p className="text-purple-400">
              Pune, Maharashtra, India
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Send us a Message</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4">
                <p className="text-green-400 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Thank you! Your message has been sent successfully.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Failed to send message. Please try again or email us directly.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div className="space-y-8">
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    How do I reset my password?
                  </h3>
                  <p className="text-gray-400">
                    You can reset your password from the login page by clicking on "Forgot Password" 
                    and following the instructions sent to your email.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    How does the ranking system work?
                  </h3>
                  <p className="text-gray-400">
                    Our ELO-based ranking system adjusts your rating based on battle outcomes. 
                    Win battles to climb through ranks from Bronze to Legendary.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Can I practice problems without competing?
                  </h3>
                  <p className="text-gray-400">
                    Yes! Visit your dashboard to access practice problems and hone your skills 
                    before entering competitive battles.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What programming languages are supported?
                  </h3>
                  <p className="text-gray-400">
                    We support 15+ languages including Python, JavaScript, C++, Java, Go, Rust, 
                    and many more. Choose your preferred language in the arena.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-500/20">
              <h2 className="text-2xl font-bold text-white mb-4">Connect With Us</h2>
              <p className="text-gray-400 mb-6">
                Follow us on social media for updates, tips, and community highlights
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-6 h-6 text-white" />
                </a>
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6 text-white" />
                </a>
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6 text-white" />
                </a>
                <a
                  href="#"
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
