import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockLogin = vi.fn();
const mockToastError = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin })
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ error: mockToastError })
}));

function renderPage() {
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza el formulario de login', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Tu usuario')).toBeInTheDocument();
    expect(screen.getByText('Sistema Restaurante')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tus credenciales')).toBeInTheDocument();
  });

  it('renderiza los 10 dígitos y botones de acción', () => {
    renderPage();
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renderiza botón de modo demo', () => {
    renderPage();
    expect(screen.getByText('Modo Capacitación / Demo')).toBeInTheDocument();
  });

  it('actualiza el input de usuario al escribir', () => {
    renderPage();
    const input = screen.getByPlaceholderText('Tu usuario');
    fireEvent.change(input, { target: { value: 'admin' } });
    expect(input.value).toBe('admin');
  });

  it('llena el PIN al presionar dígitos y llama login con 4 dígitos', async () => {
    mockLogin.mockResolvedValue({ success: true, user: { nombre: 'Admin', rol: 'admin' } });
    renderPage();
    const input = screen.getByPlaceholderText('Tu usuario');
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', '1234');
    });
  });

  it('no llama login con menos de 4 dígitos', () => {
    mockLogin.mockResolvedValue({ success: true, user: { nombre: 'Admin', rol: 'admin' } });
    renderPage();
    const input = screen.getByPlaceholderText('Tu usuario');
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('borra PIN con botón delete', () => {
    renderPage();
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(document.querySelector('[class*="bg-gray-200"]'));
  });

  it('llama login al presionar botón de login con usuario y PIN', async () => {
    mockLogin.mockResolvedValue({ success: true, user: { nombre: 'Admin', rol: 'admin' } });
    renderPage();
    const input = screen.getByPlaceholderText('Tu usuario');
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', '1234');
    });
  });

  it('muestra error si login falla', async () => {
    mockLogin.mockResolvedValue({ success: false, message: 'Credenciales incorrectas' });
    renderPage();
    const input = screen.getByPlaceholderText('Tu usuario');
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
    expect(mockToastError).toHaveBeenCalled();
  });

  it('muestra error si usuario está vacío al enviar', () => {
    const { container } = renderPage();
    const loginBtn = container.querySelector('.grid button:last-child');
    fireEvent.click(loginBtn);
    expect(screen.getByText('Ingresa el usuario')).toBeInTheDocument();
  });

  it('llama login con demo al presionar modo demo', async () => {
    mockLogin.mockResolvedValue({ success: true, user: { nombre: 'Demo', rol: 'admin' } });
    renderPage();
    fireEvent.click(screen.getByText('Modo Capacitación / Demo'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('demo', '0000');
    });
    expect(localStorage.getItem('modo_demo')).toBe('true');
  });

  it('renderiza credenciales de prueba', () => {
    renderPage();
    expect(screen.getByText(/dueno \/ 0000/)).toBeInTheDocument();
    expect(screen.getByText(/admin \/ 1234/)).toBeInTheDocument();
  });
});
