'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
}

function ChatDashboard() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const router = useRouter();

  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInitial, setUserInitial] = useState('U');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializingSession = useRef(false);

  useEffect(() => {
    const initChat = async () => {
      const currentUserInfo = localStorage.getItem('currentUser');
      if (!currentUserInfo) {
        window.location.href = '/login';
        return;
      }
      const { email, name } = JSON.parse(currentUserInfo);
      
      if (name) {
        setUserInitial(name.charAt(0).toUpperCase());
      } else if (email) {
        setUserInitial(email.charAt(0).toUpperCase());
      }

      let currentId = idFromUrl;

      if (!currentId) {
        const { data: latestSessions } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_email', email)
          .order('created_at', { ascending: false })
          .limit(1);

        if (latestSessions && latestSessions.length > 0) {
          currentId = latestSessions[0].id;
        } else {
          if (initializingSession.current) return;
          initializingSession.current = true;
          
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
            currentId = session.id;
            window.dispatchEvent(new Event('chatHistoryUpdated'));
          }
          
          initializingSession.current = false;
        }

        if (currentId) {
          router.replace(`/?id=${currentId}`);
        }
      }

      if (currentId) {
        if (currentId !== currentChatId) {
          setCurrentChatId(currentId);
          setIsLoading(true);
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', currentId)
            .order('created_at', { ascending: true });

          if (msgs && msgs.length > 0) {
            setMessages(msgs.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content
            })));
          } else {
            setMessages([{
              id: '1', role: 'system', content: '¡Hola! Soy tu Agente Tutor IA de la Universidad. \n\nRecuerda que estoy diseñado para **explicar conceptos** con detalles o pseudocódigo, pero no te brindaré el código terminado.\n\n¿En qué te puedo ayudar hoy con Pensamiento Computacional?'
            }]);
          }
          setIsLoading(false);
        }
      }
    };

    initChat();
  }, [idFromUrl, currentChatId, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !currentChatId) return;

    const userContent = inputValue;
    const tempId = Date.now().toString();
    const optimisticUserMsg: Message = { id: tempId, role: 'user', content: userContent };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Guardar mensaje de usuario en DB
      const { data: dbUserMsg } = await supabase.from('chat_messages').insert([{
        session_id: currentChatId,
        role: 'user',
        content: userContent
      }]).select().single();

      // Si es el primer mensaje del usuario, actualizar el título de la sesión
      if (messages.length === 1) {
        const newTitle = userContent.slice(0, 30) + '...';
        await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', currentChatId);
        window.dispatchEvent(new Event('chatHistoryUpdated'));
      }

      const chatHistory = [...messages, optimisticUserMsg].map((msg) => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error con el Agente AI');
      }

      // Guardar mensaje de AI en DB
      const { data: dbAiMsg } = await supabase.from('chat_messages').insert([{
        session_id: currentChatId,
        role: 'system',
        content: data.content
      }]).select().single();

      const assistantMessage: Message = {
        id: dbAiMsg ? dbAiMsg.id : (Date.now() + 1).toString(),
        role: 'system',
        content: data.content,
      };

      setMessages((prev) => {
        // Enlazar el ID real de supabase si se recibió
        const updated = prev.map(m => m.id === tempId && dbUserMsg ? { ...m, id: dbUserMsg.id } : m);
        return [...updated, assistantMessage];
      });

    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: `❌ **Error:** No se pudo conectar con el servidor LLM.\n\nDetalle: ${error.message}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className={styles.chatContainer}>
        <div className={styles.messagesArea}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.wrapperUser : styles.wrapperSystem}`}
            >
              {msg.role !== 'user' && (
                <div className={styles.avatarSystem}>🤖</div>
              )}

              <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleSystem}`}>
                {msg.role !== 'user' ? (
                  <div className={styles.markdownContent}>
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className={styles.avatarUser}>{userInitial}</div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.wrapperSystem}`}>
              <div className={styles.avatarSystem}>🤖</div>
              <div className={`${styles.messageBubble} ${styles.bubbleSystem}`}>
                <div className={styles.loader}>
                  <span>El agente está pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className={styles.spacer}></div>
        </div>

        <div className={styles.inputArea}>
          <div className={`${styles.inputWrapper} ${isLoading ? styles.disabled : ''}`}>

            <button
              className={styles.micButton}
              aria-label="Hablar con el agente (Speech to text)"
              title="Dictar por voz"
              disabled={isLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            <input
              type="text"
              className={styles.textInput}
              placeholder={isLoading ? "Esperando la respuesta del Agente..." : "Escribe tu mensaje o pregunta aquí..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              disabled={isLoading}
            />

            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              aria-label="Enviar mensaje"
              title="Enviar mensaje"
              disabled={isLoading || !inputValue.trim()}
              style={{ opacity: (!inputValue.trim() || isLoading) ? 0.6 : 1 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div className={styles.footerNote}>
            El Agente está diseñado para explicar conceptos, no para entregar código terminado.
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Cargando entorno...</div>}>
      <ChatDashboard />
    </Suspense>
  );
}
