import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: { login: vi.fn() }
}));

function TestComponent() {
  const { user, login, logout, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.nombre : 'null'}</span>
      <span data-testid="user-rol">{user ? user.rol : 'null'}</span>
      <button onClick={() => login('testuser', '1234')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithRouter(ui) {
  return render(<MemoryRouter initialEntries={['/login']}>{ui}</MemoryRouter>);
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza children', () => {
    renderWithRouter(<AuthProvider><div>child</div></AuthProvider>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('inicia con user null', () => {
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('carga usuario desde localStorage al iniciar', () => {
    const savedUser = { nombre: 'Admin', rol: 'admin' };
    localStorage.setItem('restaurante_user', JSON.stringify(savedUser));
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('Admin');
    expect(screen.getByTestId('user-rol').textContent).toBe('admin');
  });

  it('useAuth lanza error fuera del provider', () => {
    function Broken() { useAuth(); return null; }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('login llama a api.login', async () => {
    api.login.mockResolvedValue({ success: true, user: { nombre: 'TestUser', rol: 'admin' } });
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    expect(api.login).toHaveBeenCalledWith('testuser', '1234');
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestUser');
    });
  });

  it('login fallido no cambia user', async () => {
    api.login.mockResolvedValue({ success: false, message: 'PIN inválido' });
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('login con error de red no cambia user', async () => {
    api.login.mockRejectedValue(new Error('Error de conexión'));
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('logout limpia user y localStorage', async () => {
    api.login.mockResolvedValue({ success: true, user: { nombre: 'TestUser', rol: 'admin' } });
    renderWithRouter(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestUser');
    });
    expect(localStorage.getItem('restaurante_user')).toBeTruthy();
    fireEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('restaurante_user')).toBeNull();
  });
});
