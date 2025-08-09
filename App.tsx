import React, { useState, useEffect, useCallback } from 'react';
import type { Product } from './types';
import Header from './components/Header';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import AdminLogin from './components/AdminLogin';
import seedProducts from './products.json';

function App() {
  const [view, setView] = useState<'admin' | 'user'>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadInitialProducts = useCallback(() => {
    setIsLoading(true);
    try {
      // Use the statically imported product data. A copy is made to allow for sorting.
      setProducts([...seedProducts].sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || ''))));
    } catch (error) {
      console.error("Failed to load or parse products.json:", error);
      showNotification('error', 'Failed to load product database. The products.json file may be malformed.');
      setProducts([]);
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, []);

  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

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
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to log out? Changes will be lost.")) {
      return;
    }
    setIsAdmin(false);
    setView('user');
    // Reload initial data to discard any changes
    loadInitialProducts();
  };

  const handleAddProduct = (product: Product) => {
    if (products.some(p => p.supplierProductPageLink === product.supplierProductPageLink)) {
       const errorMsg = 'Product with this "Supplier\'s Product Page Link" already exists.';
       showNotification('error', errorMsg);
       throw new Error(errorMsg);
    }
    setProducts(prev => [...prev, product].sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || ''))));
    setHasUnsavedChanges(true);
    showNotification('success', 'Product added. Save changes to download.');
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.supplierProductPageLink === product.supplierProductPageLink ? product : p));
    setHasUnsavedChanges(true);
    showNotification('success', 'Product updated. Save changes to download.');
  };

  const handleDeleteProduct = (supplierProductPageLink: string) => {
    setProducts(prev => prev.filter(p => p.supplierProductPageLink !== supplierProductPageLink));
    setHasUnsavedChanges(true);
    showNotification('success', 'Product deleted. Save changes to download.');
  };

  const handleBatchUpload = (newProducts: Product[]) => {
    const existingLinks = new Set(products.map(p => p.supplierProductPageLink));
    const productsToAdd = newProducts.filter(p => !existingLinks.has(p.supplierProductPageLink));
    
    setProducts(prev => [...prev, ...productsToAdd].sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || ''))));
    setHasUnsavedChanges(true);
    showNotification('success', `${productsToAdd.length} new products added, ${newProducts.length - productsToAdd.length} duplicates skipped.`);
  };

  const handleSaveChanges = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(products, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "products.json";
    link.click();
    setHasUnsavedChanges(false);
    showNotification('success', 'Database downloaded! Replace the old products.json in the project source to make changes permanent.');
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
            onSaveChanges={handleSaveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
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
