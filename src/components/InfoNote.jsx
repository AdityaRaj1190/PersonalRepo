/**
 * A collapsed "how to read this" explainer. The long methodology notes
 * under each panel used to print in full and pushed the actual content off
 * the screen on a phone; this keeps them one tap (or click) away instead.
 * A native <details> so it works with keyboard and screen readers for free.
 */
export default function InfoNote({ className, label = 'How to read this', children }) {
  return (
    <details className={`info-note ${className ?? ''}`}>
      <summary>{label}</summary>
      <p>{children}</p>
    </details>
  );
}
