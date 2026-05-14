import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Inbox } from 'lucide-react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renderiza mensaje por defecto', () => {
    render(<EmptyState />);
    expect(screen.getByText('Sin datos disponibles')).toBeInTheDocument();
  });

  it('renderiza mensaje personalizado', () => {
    render(<EmptyState message="No hay resultados" />);
    expect(screen.getByText('No hay resultados')).toBeInTheDocument();
  });

  it('renderiza acción cuando se provee', () => {
    const onClick = vi.fn();
    render(<EmptyState action={{ label: 'Reintentar', onClick }} />);
    const btn = screen.getByText('Reintentar');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
