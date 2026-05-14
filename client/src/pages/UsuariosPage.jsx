import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCheck, UserX, Save, X, RefreshCw } from 'lucide-react';
import { api, ROLES } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SkeletonTable } from '../components/Skeleton';

const ROLES_OPCIONES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-700' },
  { value: 'gerente', label: 'Gerente', color: 'bg-blue-100 text-blue-700' },
  { value: 'cajero', label: 'Cajero', color: 'bg-green-100 text-green-700' },
  { value: 'cocina', label: 'Cocina', color: 'bg-orange-100 text-orange-700' },
  { value: 'mesonero', label: 'Mesonero', color: 'bg-gray-100 text-gray-700' },
];

export default function UsuariosPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ usuario: '', pin: '', nombre: '', rol: 'mesonero' });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      error('Error al cargar usuarios');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditando(usuario);
      setForm({
        usuario: usuario.usuario,
        pin: '****',
        nombre: usuario.nombre,
        rol: usuario.rol
      });
    } else {
      setEditando(null);
      setForm({ usuario: '', pin: '', nombre: '', rol: 'mesonero' });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm({ usuario: '', pin: '', nombre: '', rol: 'mesonero' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.usuario.trim() || !form.nombre.trim()) {
      error('Usuario y nombre son requeridos');
      return;
    }
    
    if (!editando && (!form.pin || form.pin.length !== 4)) {
      error('El PIN debe tener 4 dígitos');
      return;
    }

    try {
      if (editando) {
        const data = { usuario: form.usuario, nombre: form.nombre, rol: form.rol };
        if (form.pin !== '****') data.pin = form.pin;
        await api.actualizarUsuario(editando.id, data);
        success('Usuario actualizado');
      } else {
        await api.crearUsuario(form);
        success('Usuario creado');
      }
      cerrarModal();
      fetchUsuarios();
    } catch (err) {
      error(err.message || 'Error al guardar');
    }
  };

  const toggleEstado = async (usuario) => {
    try {
      await api.actualizarUsuario(usuario.id, { estado_activo: !usuario.estado_activo });
      success(usuario.estado_activo ? 'Usuario desactivado' : 'Usuario activado');
      fetchUsuarios();
    } catch (err) {
      error('Error al cambiar estado');
    }
  };

  const getRolColor = (rol) => {
    const r = ROLES_OPCIONES.find(o => o.value === rol);
    return r?.color || 'bg-gray-100 text-gray-700';
  };

  const getRolLabel = (rol) => {
    const r = ROLES_OPCIONES.find(o => o.value === rol);
    return r?.label || rol;
  };

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Gestión de Usuarios</h2>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors btn-press"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className={usuario.estado_activo ? '' : 'bg-gray-50 opacity-60'}>
                <td className="px-4 py-3">
                  <span className="font-mono font-medium text-gray-800">{usuario.usuario}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{usuario.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol)}`}>
                    {getRolLabel(usuario.rol)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-sm ${usuario.estado_activo ? 'text-green-600' : 'text-red-500'}`}>
                    {usuario.estado_activo ? <UserCheck size={16} /> : <UserX size={16} />}
                    {usuario.estado_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => abrirModal(usuario)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    {usuario.id !== user?.id && (
                      <button
                        onClick={() => toggleEstado(usuario)}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                          usuario.estado_activo ? 'text-red-500' : 'text-green-500'
                        }`}
                        title={usuario.estado_activo ? 'Desactivar' : 'Activar'}
                      >
                        {usuario.estado_activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuarios.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios registrados
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={cerrarModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="ej: juan123"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN {editando && <span className="text-gray-400">(dejar en blanco para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="4 dígitos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Nombre del empleado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {ROLES_OPCIONES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors btn-press flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
