import styles from "./styles.module.css";

// SSR-only React component (rendered without a client:* directive) that uses a
// CSS module.
export default function Box() {
  return (
    <div className={styles.box}>
      <span>one</span>
      <span>two</span>
      <span>three</span>
    </div>
  );
}
