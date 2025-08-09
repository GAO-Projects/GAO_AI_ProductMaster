import React, { useState, useEffect } from 'react';
import type { Product } from './types';
import Header from './components/Header';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import AdminLogin from './components/AdminLogin';

function App() {
  const [view, setView] = useState<'admin' | 'user'>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/products.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Product[] = await response.json();
        const sortedData = data.sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || '')));
        setProducts(sortedData);
      } catch (error) {
        console.error("Failed to load products from products.json:", error);
        setProducts([]); // Fallback to empty list on error
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleViewChange = (targetView: 'admin' | 'user') => {
    if (targetView === 'admin' && !isAdmin) {
      setShowLogin(true);
    } else {
      setView(targetView);
    }
  };
  
  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowLogin(false);
    setView('admin');
  };
  
  const handleLogout = () => {
    setIsAdmin(false);
    setView('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Loading Product Database...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {showLogin && <AdminLogin onLoginSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />}
      <Header currentView={view} setView={handleViewChange} isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8">
        {view === 'admin' && isAdmin ? (
          <AdminView products={products} />
        ) : (
          <UserView products={products} />
        )}
      </main>
       <footer className="text-center p-4 text-xs text-gray-500">
        GAO AI Product Master © 2024
      </footer>
    </div>
  );
}

export default App;
