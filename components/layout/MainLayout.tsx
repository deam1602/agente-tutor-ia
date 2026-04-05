'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);

    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      <Header
        sidebarCollapsed={!sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className={styles.container}>
        {(isDesktop ? sidebarOpen : true) && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => {
              if (!isDesktop) setSidebarOpen(false);
            }}
          />
        )}

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}