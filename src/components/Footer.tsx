
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="inline-block">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-srmist-blue to-srmist-light-blue text-transparent bg-clip-text">CampusConnect</h2>
            </Link>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Your gateway to SRMIST events, connecting students to opportunities across campus.
            </p>
          </div>

          {/* Links section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider uppercase">
              Contact
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  SRM University, Kattankulathur, Chennai-603203
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <a href="mailto:campusconnect@srmist.edu.in" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  campusconnect@srmist.edu.in
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <a href="tel:+911234567890" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                  +91 1234 567 890
                </a>
              </li>
            </ul>
          </div>

          {/* Social section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider uppercase">
              Follow Us
            </h3>
            <div className="mt-4 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#1877F2] transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#1DA1F2] transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#E4405F] transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-[#0A66C2] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} CampusConnect SRMIST. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link to="/privacy" className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
