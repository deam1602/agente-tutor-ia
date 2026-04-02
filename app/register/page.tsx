'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../login/Login.module.css';
import { supabase } from '@/lib/supabase';
import { normalizeCarnet, validateCarnet, getRoleFromCarnet, validateInstitutionalEmail } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [carnet, setCarnet] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCarnet = normalizeCarnet(carnet);

      if (!validateInstitutionalEmail(normalizedEmail)) {
        setError('Debes usar un correo institucional válido (@correo.url.edu.gt o @url.edu.gt).');
        setIsLoading(false);
        return;
      }

      if (!validateCarnet(normalizedCarnet)) {
        setError('El carnet debe tener formato EST1234567 o CAT1234567.');
        setIsLoading(false);
        return;
      }

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

      const role = getRoleFromCarnet(normalizedCarnet);

      if (!role) {
        setError('No se pudo determinar el rol a partir del carnet.');
        setIsLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message || 'No se pudo crear la cuenta.');
        setIsLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: normalizedEmail,
          carnet: normalizedCarnet,
          role,
        },
      ]);

      if (profileError) {
        setError('La cuenta fue creada, pero no se pudo guardar el perfil.');
        setIsLoading(false);
        return;
      }

      setSuccess('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch {
      setError('Ocurrió un error al crear la cuenta.');
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
              src="/logo.png"
              alt="Universidad Rafael Landívar"
              width={220}
              height={70}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Regístrate para usar LogicAI</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.errorMessage} style={{ color: '#7CFFB2', borderColor: '#7CFFB2' }}>{success}</div>}

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
            <label htmlFor="carnet">Carnet</label>
            <input
              type="text"
              id="carnet"
              placeholder="EST1234567 | CAT1234567"
              value={carnet}
              onChange={(e) => setCarnet(e.target.value.toUpperCase())}
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

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className={styles.demoHints}>
          <p>¿Ya tienes cuenta?</p>
          <p>
            <Link href="/login">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}