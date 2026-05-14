import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
  it('no renderiza cuando isOpen es false', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Test"><p>contenido</p></Modal>);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renderiza cuando isOpen es true', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modal"><p>contenido</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('llama onClose al hacer clic en el backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<Modal isOpen={true} onClose={onClose} title="Test"><p>contenido</p></Modal>);
    const backdrop = container.querySelector('[class*="inset-0"][class*="bg-black"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama onClose al hacer clic en el botón X', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><p>contenido</p></Modal>);
    const closeBtn = screen.getByLabelText('Cerrar');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con tecla Escape', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><p>contenido</p></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bloquea scroll del body cuando está abierto', () => {
    const { rerender } = render(<Modal isOpen={true} onClose={() => {}} title="Test"><p>contenido</p></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Modal isOpen={false} onClose={() => {}} title="Test"><p>contenido</p></Modal>);
    expect(document.body.style.overflow).toBe('');
  });

  it('aplica tamaño por defecto md', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test"><p>contenido</p></Modal>);
    const content = screen.getByText('Test').closest('.bg-white');
    expect(content.className).toContain('max-w-lg');
  });

  it('aplica tamaño sm cuando se especifica', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test" size="sm"><p>contenido</p></Modal>);
    const content = screen.getByText('Test').closest('.bg-white');
    expect(content.className).toContain('max-w-sm');
  });
});
