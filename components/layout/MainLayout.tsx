'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <div className={styles.container}>
        {!sidebarCollapsed && <Sidebar />}
        <main
          className={`${styles.mainContent} ${
            sidebarCollapsed ? styles.expanded : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}