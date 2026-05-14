import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MesaCard from './MesaCard';

const baseMesa = {
  id: 1,
  numero_mesa: 5,
  capacidad: 4,
  estado: 'libre'
};

describe('MesaCard', () => {
  it('renderiza número de mesa', () => {
    render(<MesaCard mesa={baseMesa} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renderiza capacidad cuando está presente', () => {
    render(<MesaCard mesa={baseMesa} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('no renderiza capacidad si no está presente', () => {
    render(<MesaCard mesa={{ ...baseMesa, capacidad: null }} />);
    expect(screen.queryByText('4')).not.toBeInTheDocument();
  });

  it('renderiza label según estado libre', () => {
    render(<MesaCard mesa={baseMesa} />);
    expect(screen.getByText('Libre')).toBeInTheDocument();
  });

  it('renderiza label ocupada', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'ocupada' }} />);
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
  });

  it('renderiza label atendida', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'atendida' }} />);
    expect(screen.getByText('Atendida')).toBeInTheDocument();
  });

  it('renderiza label cuenta', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'cuenta' }} />);
    expect(screen.getByText('Cuenta')).toBeInTheDocument();
  });

  it('renderiza label limpiando', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'limpiando' }} />);
    expect(screen.getByText('Limpiando')).toBeInTheDocument();
  });

  it('llama onClick al hacer click en la card cuando libre', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={baseMesa} onClick={onClick} />);
    fireEvent.click(screen.getByText('Mesa'));
    expect(onClick).toHaveBeenCalledWith(baseMesa);
  });

  it('llama onClick al hacer click en la card cuando atendida', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'atendida' }} onClick={onClick} />);
    fireEvent.click(screen.getByText('Mesa'));
    expect(onClick).toHaveBeenCalled();
  });

  it('no llama onClick al hacer click en la card cuando ocupada', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'ocupada' }} onClick={onClick} />);
    fireEvent.click(screen.getByText('Mesa'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('no llama onClick al hacer click en la card cuando cuenta', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'cuenta' }} onClick={onClick} />);
    fireEvent.click(screen.getByText('Mesa'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('no llama onClick al hacer click en la card cuando limpiando', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'limpiando' }} onClick={onClick} />);
    fireEvent.click(screen.getByText('Mesa'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('muestra botón Nuevo Pedido cuando libre', () => {
    render(<MesaCard mesa={baseMesa} />);
    expect(screen.getByText('Nuevo Pedido')).toBeInTheDocument();
  });

  it('llama onClick al presionar Nuevo Pedido', () => {
    const onClick = vi.fn();
    render(<MesaCard mesa={baseMesa} onClick={onClick} />);
    fireEvent.click(screen.getByText('Nuevo Pedido'));
    expect(onClick).toHaveBeenCalledWith(baseMesa);
  });

  it('muestra botón Pedir la Cuenta cuando ocupada', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'ocupada' }} />);
    expect(screen.getByText('Pedir la Cuenta')).toBeInTheDocument();
  });

  it('muestra botón Pedir la Cuenta cuando atendida', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'atendida' }} />);
    expect(screen.getByText('Pedir la Cuenta')).toBeInTheDocument();
  });

  it('llama onCerrarMesa al presionar Pedir la Cuenta', () => {
    const onCerrarMesa = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'ocupada' }} onCerrarMesa={onCerrarMesa} />);
    fireEvent.click(screen.getByText('Pedir la Cuenta'));
    expect(onCerrarMesa).toHaveBeenCalledWith({ ...baseMesa, estado: 'ocupada' });
  });

  it('muestra texto Procesando en Caja cuando cuenta', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'cuenta' }} />);
    expect(screen.getByText('Procesando en Caja...')).toBeInTheDocument();
  });

  it('muestra botón Marcar como Limpia cuando limpiando', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'limpiando' }} />);
    expect(screen.getByText('Marcar como Limpia')).toBeInTheDocument();
  });

  it('llama onEstadoChange con id y libre al limpiar', () => {
    const onEstadoChange = vi.fn();
    render(<MesaCard mesa={{ ...baseMesa, estado: 'limpiando' }} onEstadoChange={onEstadoChange} />);
    fireEvent.click(screen.getByText('Marcar como Limpia'));
    expect(onEstadoChange).toHaveBeenCalledWith(1, 'libre');
  });

  it('muestra botones editar/eliminar cuando libre y hay handlers', () => {
    render(<MesaCard mesa={baseMesa} onEditar={vi.fn()} onEliminar={vi.fn()} />);
    expect(screen.getByTitle('Editar')).toBeInTheDocument();
    expect(screen.getByTitle('Eliminar')).toBeInTheDocument();
  });

  it('no muestra editar/eliminar cuando ocupada aunque haya handlers', () => {
    render(<MesaCard mesa={{ ...baseMesa, estado: 'ocupada' }} onEditar={vi.fn()} onEliminar={vi.fn()} />);
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument();
  });

  it('llama onEditar al presionar editar', () => {
    const onEditar = vi.fn();
    render(<MesaCard mesa={baseMesa} onEditar={onEditar} onEliminar={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Editar'));
    expect(onEditar).toHaveBeenCalledWith(baseMesa);
  });

  it('llama onEliminar al presionar eliminar', () => {
    const onEliminar = vi.fn();
    render(<MesaCard mesa={baseMesa} onEditar={vi.fn()} onEliminar={onEliminar} />);
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(onEliminar).toHaveBeenCalledWith(baseMesa);
  });

  it('no se rompe sin handlers', () => {
    render(<MesaCard mesa={baseMesa} />);
    fireEvent.click(screen.getByText('Nuevo Pedido'));
  });

  it('no renderiza botón Nuevo Pedido en estados que no son libre', () => {
    const estados = ['ocupada', 'atendida', 'cuenta', 'limpiando'];
    estados.forEach(estado => {
      const { unmount } = render(<MesaCard mesa={{ ...baseMesa, estado }} />);
      expect(screen.queryByText('Nuevo Pedido')).not.toBeInTheDocument();
      unmount();
    });
  });

  it('no se rompe al hacer click en card sin handlers en estados no clickeables', () => {
    const estados = ['ocupada', 'cuenta', 'limpiando'];
    estados.forEach(estado => {
      const { unmount } = render(<MesaCard mesa={{ ...baseMesa, estado }} />);
      fireEvent.click(screen.getByText('Mesa'));
      unmount();
    });
  });
});
