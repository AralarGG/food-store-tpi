import { lazy } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage'
import { CarritoPage } from '../features/pedidos/pages/CarritoPage'
import { CheckoutPage } from '../features/pedidos/pages/CheckoutPage'
import { MisPedidosPage } from '../features/pedidos/pages/MisPedidosPage'
import { CatalogoPage } from '../features/productos/pages/CatalogoPage'
import { EstadoVacio } from '../shared/components/EstadoVacio'
import { AdminLayout } from '../shared/layout/AdminLayout'
import { MainLayout } from '../shared/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'

// Las pantallas del panel se descargan recién cuando un admin entra: un cliente no carga ese código
const AdminResumenPage = lazy(() =>
  import('../features/pedidos/pages/AdminResumenPage').then((m) => ({ default: m.AdminResumenPage })),
)
const AdminPedidosPage = lazy(() =>
  import('../features/pedidos/pages/AdminPedidosPage').then((m) => ({ default: m.AdminPedidosPage })),
)
const AdminProductosPage = lazy(() =>
  import('../features/productos/pages/AdminProductosPage').then((m) => ({ default: m.AdminProductosPage })),
)
const AdminCategoriasPage = lazy(() =>
  import('../features/categorias/pages/AdminCategoriasPage').then((m) => ({ default: m.AdminCategoriasPage })),
)
const AdminUsuariosPage = lazy(() =>
  import('../features/usuarios/pages/AdminUsuariosPage').then((m) => ({ default: m.AdminUsuariosPage })),
)

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
        {/* Públicas */}
        <Route path="/" element={<CatalogoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/carrito" element={<CarritoPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Con sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/mis-pedidos" element={<MisPedidosPage />} />
        </Route>

        {/* Solo admin */}
        <Route element={<ProtectedRoute rolesPermitidos={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/resumen" replace />} />
            <Route path="resumen" element={<AdminResumenPage />} />
            <Route path="pedidos" element={<AdminPedidosPage />} />
            <Route path="productos" element={<AdminProductosPage />} />
            <Route path="categorias" element={<AdminCategoriasPage />} />
            <Route path="usuarios" element={<AdminUsuariosPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <EstadoVacio
              titulo="Página no encontrada"
              mensaje="La dirección no corresponde a ninguna pantalla."
              accion={
                <Link to="/" className="font-semibold text-emerald-800 hover:underline">
                  Ir al catálogo
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
)
