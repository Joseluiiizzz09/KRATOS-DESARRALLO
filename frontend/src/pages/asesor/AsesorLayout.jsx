import SidebarLayout from '../../components/SidebarLayout.jsx';
import { ICON_LLAMADAS, ICON_TABLERO, ICON_VENTAS } from '../../components/navIcons.jsx';

const NAV_ITEMS = [
  { to: 'llamadas', label: 'Base de llamadas', icon: ICON_LLAMADAS },
  { to: 'tablero', label: 'Tablero y métricas', icon: ICON_TABLERO },
  { to: 'ventas', label: 'Mis ventas', icon: ICON_VENTAS },
];

export default function AsesorLayout() {
  return <SidebarLayout items={NAV_ITEMS} />;
}
