import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message = 'Sin datos disponibles', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-300" />
      </div>
      <p className="text-gray-400 text-sm font-medium">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors btn-press"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
