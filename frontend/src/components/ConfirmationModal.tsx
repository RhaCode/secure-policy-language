import { X, AlertTriangle, Trash2, User, Database, FileJson } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'delete' | 'user' | 'database' | 'file' | 'warning';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-destructive/20',
      iconColor: 'text-destructive',
      button: 'bg-destructive hover:bg-red-600 text-destructive-foreground'
    },
    warning: {
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
      button: 'bg-warning hover:bg-yellow-600 text-warning-foreground'
    },
    info: {
      iconBg: 'bg-info/20',
      iconColor: 'text-info',
      button: 'bg-info hover:bg-blue-600 text-info-foreground'
    }
  };

  const iconMap = {
    delete: Trash2,
    user: User,
    database: Database,
    file: FileJson,
    warning: AlertTriangle
  };

  const IconComponent = iconMap[icon];
  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-primary rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <IconComponent size={20} className={styles.iconColor} />
            </div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover-bg rounded-lg text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-primary">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-primary text-primary rounded-lg hover-bg disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}