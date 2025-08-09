import React, { useState, useEffect, useCallback } from 'react';
import type { Product } from './types';
import Header from './components/Header';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import AdminLogin from './components/AdminLogin';
import { getAllProducts, addProduct, updateProduct, deleteProduct, addProductsBatch } from './db';

function App() {
  const [view, setView] = useState<'admin' | 'user'>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbProducts = await getAllProducts();
      // Check if DB is empty and seed it from JSON file if needed.
      if (dbProducts.length === 0) {
        console.log("Database is empty. Seeding from products.json...");
        const response = await fetch('/products.json');
        if (response.ok) {
          const seedProducts: Product[] = await response.json();
          await addProductsBatch(seedProducts);
          const seededProducts = await getAllProducts();
          setProducts(seededProducts);
          showNotification('success', `Database seeded with ${seededProducts.length} sample products.`);
        } else {
           console.error("Failed to fetch seed data from products.json");
           setProducts([]);
        }
      } else {
        setProducts(dbProducts);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      showNotification('error', 'Failed to load product database.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

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

  const handleAddProduct = async (product: Product) => {
    try {
      await addProduct(product);
      await refreshProducts();
      showNotification('success', 'Product added successfully!');
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.toString());
      throw error;
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      await updateProduct(product);
      await refreshProducts();
      showNotification('success', 'Product updated successfully!');
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.toString());
      throw error;
    }
  };

  const handleDeleteProduct = async (supplierProductPageLink: string) => {
    try {
      await deleteProduct(supplierProductPageLink);
      await refreshProducts();
      showNotification('success', 'Product deleted successfully!');
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.toString());
    }
  };

  const handleBatchUpload = async (newProducts: Product[]) => {
    try {
      const result = await addProductsBatch(newProducts);
      await refreshProducts();
      showNotification('success', `${result.success} new products added, ${result.skipped} duplicates skipped.`);
    } catch (error: any) {
      console.error(error);
      showNotification('error', error.toString());
    }
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
      {notification && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-md text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in`}>
          {notification.message}
        </div>
      )}
      {showLogin && <AdminLogin onLoginSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />}
      <Header currentView={view} setView={handleViewChange} isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8">
        {view === 'admin' && isAdmin ? (
          <AdminView 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBatchUpload={handleBatchUpload}
          />
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
