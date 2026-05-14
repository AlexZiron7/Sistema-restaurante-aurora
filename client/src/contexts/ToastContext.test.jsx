import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from './ToastContext';

function TestComponent() {
  const { success, error, info, warning, toasts, addToast, removeToast } = useToast();
  return (
    <div>
      <button onClick={() => success('mensaje éxito')}>success</button>
      <button onClick={() => error('mensaje error')}>error</button>
      <button onClick={() => info('mensaje info')}>info</button>
      <button onClick={() => warning('mensaje warning')}>warning</button>
      <button onClick={() => addToast('mensaje custom', 'info', 5000)}>addToast</button>
      <button onClick={() => removeToast(999)}>removeToast</button>
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza children', () => {
    render(<ToastProvider><div>child</div></ToastProvider>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('success agrega un toast', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('success'));
    expect(screen.getByText('mensaje éxito')).toBeInTheDocument();
  });

  it('error agrega un toast', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('error'));
    expect(screen.getByText('mensaje error')).toBeInTheDocument();
  });

  it('info agrega un toast', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('info'));
    expect(screen.getByText('mensaje info')).toBeInTheDocument();
  });

  it('warning agrega un toast', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('warning'));
    expect(screen.getByText('mensaje warning')).toBeInTheDocument();
  });

  it('addToast con duración custom', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('addToast'));
    expect(screen.getByText('mensaje custom')).toBeInTheDocument();
  });

  it('elimina toast después de la duración', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('success'));
    expect(screen.getByText('mensaje éxito')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText('mensaje éxito')).not.toBeInTheDocument();
  });

  it('removeToast elimina si existe el id', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('success'));
    expect(screen.getByText('mensaje éxito')).toBeInTheDocument();
    fireEvent.click(screen.getByText('removeToast'));
    expect(screen.getByText('mensaje éxito')).toBeInTheDocument();
  });

  it('useToast lanza error si se usa fuera del provider', () => {
    function Broken() { useToast(); return null; }
    expect(() => render(<Broken />)).toThrow('useToast must be used within a ToastProvider');
  });

  it('múltiples toasts se muestran', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    fireEvent.click(screen.getByText('success'));
    fireEvent.click(screen.getByText('error'));
    expect(screen.getByText('mensaje éxito')).toBeInTheDocument();
    expect(screen.getByText('mensaje error')).toBeInTheDocument();
  });
});
