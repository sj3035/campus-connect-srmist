
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-9xl font-extrabold text-srmist-blue mb-6">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="bg-srmist-blue hover:bg-srmist-dark-blue">
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
