import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footerAction }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #374151' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>{children}</div>

        {/* Footer */}
        {footerAction && (
          <div style={{ padding: '16px 24px', backgroundColor: '#243044', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
