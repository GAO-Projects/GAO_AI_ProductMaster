import React, { useState, useEffect } from 'react';
import type { Product } from './types';
import Header from './components/Header';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import AdminLogin from './components/AdminLogin';
import * as db from './db';

const initialProducts: Product[] = [
  {
    productName: "Advanced RF Signal Generator",
    productID: "GAO-123-001",
    supplierWebsiteLink: "https://supplier-a.com",
    sourcingWebsiteName: "Global Electronics",
    supplierCountryName: "USA",
    supplierProductPageLink: "https://supplier-a.com/products/rf-gen-pro",
    category: "RF Equipment",
    gaoTekLink: "https://gaotek.com/product/advanced-rf-signal-generator"
  },
  {
    productName: "High-Precision Oscilloscope",
    productID: "GAO-456-002",
    supplierWebsiteLink: "https://supplier-b.net",
    sourcingWebsiteName: "Test Instruments Inc.",
    supplierCountryName: "Germany",
    supplierProductPageLink: "https://supplier-b.net/items/osc-4000x",
    category: "Test Equipment",
    gaoTekLink: "https://gaotek.com/product/high-precision-oscilloscope"
  },
    {
    productName: "Portable Spectrum Analyzer",
    productID: "GAO-789-003",
    supplierWebsiteLink: "https://supplier-c.co.jp",
    sourcingWebsiteName: "JP Tech",
    supplierCountryName: "Japan",
    supplierProductPageLink: "https://supplier-c.co.jp/analyzer/portable-spec",
    category: "Test Equipment",
    gaoTekLink: "https://gaotek.com/product/portable-spectrum-analyzer"
  }
];


function App() {
  const [view, setView] = useState<'admin' | 'user'>('user');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        let existingProducts = await db.getAllProducts();
        if (existingProducts.length === 0) {
          // Using the new batch add which skips duplicates.
          await db.addProductsBatch(initialProducts);
          existingProducts = await db.getAllProducts();
        }
        setProducts(existingProducts);
      } catch (error) {
        console.error("Failed to load products from DB:", error);
        setProducts(initialProducts); // Fallback
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

  const addProduct = async (newProduct: Product) => {
    await db.addProduct(newProduct);
    setProducts(prev => [...prev, newProduct].sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || ''))));
  };
  
  const updateProduct = async (updatedProduct: Product) => {
    await db.updateProduct(updatedProduct);
    setProducts(prev => prev.map(p => p.supplierProductPageLink === updatedProduct.supplierProductPageLink ? updatedProduct : p));
  };
  
  const deleteProduct = async (supplierProductPageLink: string) => {
    await db.deleteProduct(supplierProductPageLink);
    setProducts(prev => prev.filter(p => p.supplierProductPageLink !== supplierProductPageLink));
  };

  const addProductsBatch = async (newProducts: Product[]) => {
    const result = await db.addProductsBatch(newProducts);
    // After batch operation, refetch all to ensure UI is in sync.
    const allProducts = await db.getAllProducts();
    setProducts(allProducts);
    return result; // Pass result back to AdminView for notification
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
          <AdminView 
            products={products} 
            addProduct={addProduct} 
            addProductsBatch={addProductsBatch} 
            updateProduct={updateProduct} 
            deleteProduct={deleteProduct}
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