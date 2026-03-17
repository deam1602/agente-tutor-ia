'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { supabase } from '@/lib/supabase';

interface ChatHistory {
  id: string;
  title: string;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatHistory[]>([]);
  const router = useRouter();

  const loadHistory = async () => {
    const currentUserInfo = localStorage.getItem('currentUser');
    if (!currentUserInfo) return;
    const { email } = JSON.parse(currentUserInfo);

    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (data) {
      setConversations(data);
    }
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener('chatHistoryUpdated', loadHistory);
    return () => window.removeEventListener('chatHistoryUpdated', loadHistory);
  }, []);

  const handleNewChat = async () => {
    const currentUserInfo = localStorage.getItem('currentUser');
    if (!currentUserInfo) {
      router.push('/login');
      return;
    }
    const { email } = JSON.parse(currentUserInfo);

    const { data: session } = await supabase
      .from('chat_sessions')
      .insert([{ user_email: email, title: 'Nueva Conversación' }])
      .select()
      .single();

    if (session) {
      await supabase.from('chat_messages').insert([{
        session_id: session.id,
        role: 'system',
        content: '¡Hola! Soy tu Agente Tutor IA de la Universidad. \n\nRecuerda que estoy diseñado para **explicar conceptos** con detalles o pseudocódigo, pero no te brindaré el código terminado.\n\n¿En qué te puedo ayudar hoy con Pensamiento Computacional?'
      }]);

      loadHistory();
      router.push(`/?id=${session.id}`);
      setIsOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={toggleSidebar} />}

      <button
        className={`${styles.toggleButton} ${isOpen ? styles.hidden : ''}`}
        onClick={toggleSidebar}
        aria-label="Abrir menú"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Conversación
          </button>
          <button className={styles.closeButton} onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <h3 className={styles.sectionTitle}>Historial Reciente</h3>
          <ul className={styles.chatList}>
            {conversations.map((chat) => (
              <li key={chat.id}>
                <Link href={`/?id=${chat.id}`} className={styles.chatItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className={styles.chatTitle}>{chat.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
