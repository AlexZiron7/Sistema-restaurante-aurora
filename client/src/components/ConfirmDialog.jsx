import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirmar', confirmVariant = 'danger' }) {
  const btnClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <p className="text-gray-600 text-sm mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors btn-press"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors btn-press ${btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
