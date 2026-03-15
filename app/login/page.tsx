'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validUsers = [
      { email: 'estudiante@url.edu.gt', password: 'password123', role: 'student' },
      { email: 'admin@url.edu.gt', password: 'admin', role: 'admin' }
    ];

    const userMatch = validUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (userMatch) {
      localStorage.setItem('currentUser', JSON.stringify({ email: userMatch.email, role: userMatch.role }));
      router.push('/');
    } else {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundEffects}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>

      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>🤖</div>
          <h1 className={styles.title}>Agente Tutor IA</h1>
          <p className={styles.subtitle}>Inicia sesión para comenzar a aprender</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Correo Institucional</label>
            <input
              type="email"
              id="email"
              placeholder="estudiante@url.edu.gt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Ingresar al Tutor
          </button>
        </form>

        <div className={styles.demoHints}>
          <p><strong>Cuentas Demo:</strong></p>
          <p>👨‍🎓 estudiante@url.edu.gt / password123</p>
          <p>👨‍🏫 admin@url.edu.gt / admin</p>
        </div>
      </div>
    </div>
  );
}
