import React from 'react';
import { BrainCircuitIcon } from './icons';

interface HeaderProps {
  currentView: 'admin' | 'user';
  setView: (view: 'admin' | 'user') => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, isAdmin, onLogout }) => {
  const baseButtonClass = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200";
  const activeButtonClass = "bg-indigo-600 text-white shadow-md";
  const inactiveButtonClass = "bg-gray-700 text-gray-300 hover:bg-gray-600";
  const logoutButtonClass = "bg-red-600 text-white hover:bg-red-700";

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <BrainCircuitIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="ml-3 text-2xl font-bold text-white tracking-tight">GAO AI Product Master</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-gray-900 p-1 rounded-lg flex space-x-1">
              <button
                onClick={() => setView('user')}
                className={`${baseButtonClass} ${currentView === 'user' ? activeButtonClass : inactiveButtonClass}`}
              >
                User View
              </button>
              <button
                  onClick={() => setView('admin')}
                  className={`${baseButtonClass} ${currentView === 'admin' ? activeButtonClass : inactiveButtonClass}`}
              >
                  Admin View
              </button>
            </div>
            {isAdmin && (
               <button
                  onClick={onLogout}
                  className={`${baseButtonClass} ${logoutButtonClass}`}
               >
                  Logout
               </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
