'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../login/Login.module.css';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // Supabase automáticamente leerá el #access_token de la URL
      // para autenticar esta petición y saber a qué usuario actualizar.
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || 'Error al actualizar la contraseña. Asegúrate de haber usado el enlace completo.');
        setIsLoading(false);
        return;
      }

      setSuccess('¡Contraseña actualizada con éxito!');
      
      // Cerrar sesión y limpiar localStorage para obligarlo a loguearse de nuevo
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err) {
      setError('Ocurrió un error inesperado al actualizar.');
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
          <h1 className={styles.title}>Actualizar Contraseña</h1>
          <p className={styles.subtitle}>Escribe tu nueva contraseña</p>
        </div>

        <form className={styles.form} onSubmit={handleUpdatePassword}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.errorMessage} style={{ color: '#7CFFB2', borderColor: '#7CFFB2' }}>{success}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="password">Nueva contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading || !!success}>
            {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
