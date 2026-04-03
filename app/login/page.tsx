'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Login.module.css';
import { supabase } from '@/lib/supabase';
import { validateInstitutionalEmail } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!validateInstitutionalEmail(normalizedEmail)) {
        setError('Debes ingresar un correo institucional válido.');
        setIsLoading(false);
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (loginError || !data.user) {
        setError('Credenciales incorrectas. Intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, carnet, role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('No se encontró el perfil del usuario.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          email: profile.email,
          name: profile.carnet,
          role: profile.role,
        })
      );

      router.push('/');
    } catch {
      setError('Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoading(false);
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
          <div className={styles.logoWrapper}>
            <Image
              src="/blackURLlogo.png"
              alt="Universidad Rafael Landívar"
              width={220}
              height={70}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className={styles.title}>LogicAI</h1>
          <p className={styles.subtitle}>Inicia sesión para comenzar a aprender</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Correo Institucional</label>
            <input
              type="email"
              id="email"
              placeholder="tu.correo@url.edu.gt"
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

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar al Tutor'}
          </button>
        </form>

        <div className={styles.demoHints}>
          <p>¿No tienes cuenta?</p>
          <p>
            <Link href="/register">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}