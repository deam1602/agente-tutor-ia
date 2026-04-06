'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import styles from './Header.module.css';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  sidebarCollapsed,
  onToggleSidebar,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userInitial, setUserInitial] = useState('U');
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const userInfo = localStorage.getItem('currentUser');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setUserRole(parsed.role || '');

        if (parsed.name) {
          setUserName(parsed.name);
          setUserInitial(parsed.name.charAt(0).toUpperCase());
        } else if (parsed.email) {
          const namePart = parsed.email.split('@')[0];
          setUserName(namePart);
          setUserInitial(namePart.charAt(0).toUpperCase());
        }
      } catch (e) {
        console.error('Error parsing user info', e);
      }
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/analytics');
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Mostrar historial' : 'Ocultar historial'}
          aria-label={sidebarCollapsed ? 'Mostrar historial' : 'Ocultar historial'}
        >
          {sidebarCollapsed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M9 4v16"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M15 4v16"></path>
            </svg>
          )}
        </button>

        <div className={styles.logoContainer}>
          <Image
            src="/logo.png"
            alt="Logo Universidad"
            width={140}
            height={40}
            className={styles.universityLogo}
            style={{ objectFit: 'contain' }}
            priority
          />
          <h1 className={styles.title}>LogicAI</h1>
        </div>
      </div>

      <div className={styles.userActions}>
        {userRole === 'superUser' && (
          <button
            type="button"
            className={styles.dashboardBtn}
            onClick={handleGoToDashboard}
          >
            Dashboard
          </button>
        )}

        <span className={styles.userName}>{userName}</span>

        <div className={styles.avatarContainer} ref={menuRef}>
          <div
            className={styles.avatar}
            onClick={() => setShowMenu(!showMenu)}
            role="button"
            tabIndex={0}
          >
            {userInitial}
          </div>
          {showMenu && (
            <div className={styles.dropdownMenu}>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}