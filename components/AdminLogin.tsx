import React, { useState, FormEvent } from 'react';
import { BrainCircuitIcon, XIcon } from './icons';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // --- CLIENT-SIDE AUTHENTICATION (LESS SECURE) ---
    // For React apps deployed on Vercel, you must prefix env variables with REACT_APP_
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("Configuration Error: `REACT_APP_ADMIN_PASSWORD` environment variable is not set.");
      setError("Application is not configured correctly. The administrator must set the admin password.");
      return;
    }

    if (password === adminPassword) {
      // Store session so user stays logged in until tab/browser closes
      sessionStorage.setItem("isAdmin", "true");
      onLoginSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm w-full m-4 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XIcon className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center">
          <BrainCircuitIcon className="h-12 w-12 text-indigo-500 mb-4" />
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Admin Access
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Please enter the password to manage products.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
