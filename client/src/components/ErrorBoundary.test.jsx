import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function FallbackComponent() {
  return <p>contenido normal</p>;
}

function BrokenComponent() {
  throw new Error('error de prueba');
}

describe('ErrorBoundary', () => {
  it('renderiza children cuando no hay error', () => {
    render(<ErrorBoundary><FallbackComponent /></ErrorBoundary>);
    expect(screen.getByText('contenido normal')).toBeInTheDocument();
  });

  it('muestra fallback cuando hay error', () => {
    // suprimir console.error del error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BrokenComponent /></ErrorBoundary>);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
    spy.mockRestore();
  });
});
