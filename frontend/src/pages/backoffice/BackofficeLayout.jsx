import { useLocation, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/SidebarLayout.jsx';
import AddRegistroPanel from '../../components/AddRegistroPanel.jsx';
import { toggleRotacion, useRotAbierta } from '../../components/bo.jsx';
import { ICON_AVANCE, ICON_BASE, ICON_CARGA, ICON_RENDIMIENTO, ICON_ROTACION } from '../../components/navIcons.jsx';

export default function BackofficeLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const enBase = pathname.endsWith('/base');
  const rotAbierta = useRotAbierta();

  const groups = [
    {
      section: 'Principal',
      items: [
        { to: 'base', label: 'Base', icon: ICON_BASE },
        { to: 'carga-masiva', label: 'Carga Masiva', icon: ICON_CARGA },
        {
          label: 'Rotación inteligente',
          icon: ICON_ROTACION,
          active: enBase && rotAbierta,
          onClick: () => { if (!enBase) navigate('/backoffice/base'); toggleRotacion(true); },
        },
      ],
    },
    {
      section: 'Reportes',
      items: [
        { to: 'rendimiento', label: 'Rendimiento', icon: ICON_RENDIMIENTO },
        { to: 'avance-asesores', label: 'Avance Asesores', icon: ICON_AVANCE },
      ],
    },
  ];

  return <SidebarLayout items={groups} extra={enBase ? <AddRegistroPanel /> : null} />;
}
