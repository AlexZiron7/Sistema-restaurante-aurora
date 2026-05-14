import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CerrarMesaModal from './CerrarMesaModal';

const mockGetPedidoMesa = vi.fn();
const mockCerrarMesa = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();

vi.mock('../contexts/RestaurantContext', () => ({
  useRestaurant: () => ({
    getPedidoMesa: mockGetPedidoMesa,
    cerrarMesa: mockCerrarMesa
  })
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError
  })
}));

const mesa = { id: 1, numero_mesa: 5 };

const itemsMock = [
  { nombre_producto: 'Pizza', precio: 12.50 },
  { nombre_producto: 'Cerveza', precio: 3.00 },
  { nombre_producto: 'Helado', precio: 4.50 }
];

function renderModal(props = {}) {
  return render(
    <CerrarMesaModal
      isOpen={true}
      onClose={vi.fn()}
      mesa={mesa}
      {...props}
    />
  );
}

describe('CerrarMesaModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPedidoMesa.mockResolvedValue(itemsMock);
    mockCerrarMesa.mockResolvedValue({ success: true, total_con_propina: 20.00 });
  });

  it('no renderiza cuando isOpen es false', () => {
    render(<CerrarMesaModal isOpen={false} onClose={vi.fn()} mesa={mesa} />);
    expect(screen.queryByText(/Cerrar Mesa/)).not.toBeInTheDocument();
  });

  it('no renderiza cuando mesa es null', () => {
    render(<CerrarMesaModal isOpen={true} onClose={vi.fn()} mesa={null} />);
    expect(screen.queryByText(/Cerrar Mesa/)).not.toBeInTheDocument();
  });

  it('renderiza título con número de mesa', async () => {
    renderModal();
    expect(await screen.findByText('Cerrar Mesa 5')).toBeInTheDocument();
  });

  it('carga items del pedido al abrir', async () => {
    renderModal();
    await waitFor(() => {
      expect(mockGetPedidoMesa).toHaveBeenCalledWith(1);
    });
    expect(await screen.findByText('Pizza')).toBeInTheDocument();
    expect(await screen.findByText('Cerveza')).toBeInTheDocument();
    expect(await screen.findByText('Helado')).toBeInTheDocument();
  });

  it('muestra subtotal correcto', async () => {
    renderModal();
    await screen.findByText('Pizza');
    const subtotalLabel = screen.getByText('Subtotal:').closest('div');
    expect(subtotalLabel.textContent).toContain('$20.00');
  });

  it('selecciona propina 0% por defecto', async () => {
    renderModal();
    await screen.findByText('Pizza');
    const btn0 = screen.getByText('0%');
    expect(btn0.className).toContain('bg-primary-600');
  });

  it('cambia propina al presionar 10%', async () => {
    renderModal();
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('10%'));
    const totalElements = screen.getAllByText(/\$22\.00/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('cambia propina al presionar 15%', async () => {
    renderModal();
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('15%'));
    const totalElements = screen.getAllByText(/\$23\.00/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('cambia propina al presionar 20%', async () => {
    renderModal();
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('20%'));
    const totalElements = screen.getAllByText(/\$24\.00/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('permite propina personalizada', async () => {
    renderModal();
    await screen.findByText('Pizza');
    const input = screen.getByPlaceholderText('%');
    fireEvent.change(input, { target: { value: '25' } });
    const totalElements = screen.getAllByText(/\$25\.00/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('llama cerrarMesa al confirmar', async () => {
    renderModal();
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('Confirmar y Cerrar Mesa'));
    await waitFor(() => {
      expect(mockCerrarMesa).toHaveBeenCalledWith(1, 0);
    });
  });

  it('llama onClose y success si cerrarMesa es exitoso', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('Confirmar y Cerrar Mesa'));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('llama error si cerrarMesa falla', async () => {
    mockCerrarMesa.mockResolvedValue({ success: false });
    renderModal();
    await screen.findByText('Pizza');
    fireEvent.click(screen.getByText('Confirmar y Cerrar Mesa'));
    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith('Error al cerrar la mesa');
    });
  });

  it('cierra al hacer click en backdrop', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await screen.findByText('Cerrar Mesa 5');
    const backdrop = document.querySelector('[class*="bg-black/60"]');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
