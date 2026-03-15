import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>🤖</div>
        <h1 className={styles.title}>TutorIA</h1>
      </div>
      <div className={styles.userActions}>
        <span className={styles.userName}>Estudiante</span>
        <div className={styles.avatar}>E</div>
      </div>
    </header>
  );
}
