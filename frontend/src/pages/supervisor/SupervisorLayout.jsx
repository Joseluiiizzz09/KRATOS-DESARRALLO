import SidebarLayout from '../../components/SidebarLayout.jsx';
import { ICON_EQUIPO, ICON_METRICAS, ICON_VENTAS } from '../../components/navIcons.jsx';

const NAV_ITEMS = [
  { to: 'metricas', label: 'Métricas', icon: ICON_METRICAS },
  { to: 'llamadas', label: 'Base de llamadas', icon: ICON_EQUIPO },
  { to: 'ventas', label: 'Ventas del equipo', icon: ICON_VENTAS },
];

export default function SupervisorLayout() {
  return <SidebarLayout items={NAV_ITEMS} />;
}
