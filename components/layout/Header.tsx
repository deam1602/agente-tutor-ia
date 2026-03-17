'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userInitial, setUserInitial] = useState('U');
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Load dynamic user info
    const userInfo = localStorage.getItem('currentUser');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
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
    localStorage.removeItem('currentUser');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>🤖</div>
        <h1 className={styles.title}>Pensamiento Computacional</h1>
      </div>
      <div className={styles.userActions}>
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
              <button onClick={handleLogout} className={styles.logoutBtn}>Cerrar Sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
