import React from "react";

export default function Modal({ title, children, onClose, onConfirm, confirmText = "Save Changes", type = "primary", loading = false }) {
  
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {onConfirm && (
            <button className={`btn btn-${type}`} onClick={onConfirm} disabled={loading}>
              {loading ? "Processing..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
