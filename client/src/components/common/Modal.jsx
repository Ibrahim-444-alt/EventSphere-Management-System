import { useEffect } from "react";
import "./Modal.css";

// Small reusable modal. Booth assignment uses it now; Sessions and
// Speakers will reuse it later — so it stays generic. It only knows how to
// open, close, and render whatever children it's handed.
function Modal({ isOpen, title, onClose, children }) {
  // Escape closes the modal. The listener only exists while the modal is
  // open, and the cleanup removes it so listeners don't pile up.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Clicking the dark backdrop closes the modal. stopPropagation on the
    // panel stops a click *inside* it from bubbling up and closing it too.
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;