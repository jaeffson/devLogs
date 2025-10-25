import React from 'react';

// Importando os ícones do Heroicons 2
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBeaker,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineCurrencyDollar,
  HiOutlineCog6Tooth,
  HiOutlineSquares2X2,
  HiOutlineArrowDownTray,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineBuildingOffice2,
  
  // --- ÍCONES QUE FALTAVAM ---
  HiOutlineUserCircle, // Para o avatar do perfil
  HiOutlineUser,       // Para o link "Meu Perfil"

} from 'react-icons/hi2';

// Exportamos os ícones já renderizados
export const icons = {
  plus: <HiOutlinePlus />,
  search: <HiOutlineMagnifyingGlass />,
  edit: <HiOutlinePencilSquare />,
  trash: <HiOutlineTrash />,
  logout: <HiOutlineArrowLeftOnRectangle />,
  pill: <HiOutlineBeaker />,
  users: <HiOutlineUserGroup />,
  clipboard: <HiOutlineClipboardDocumentList />,
  dollar: <HiOutlineCurrencyDollar />,
  settings: <HiOutlineCog6Tooth />,
  dashboard: <HiOutlineSquares2X2 />,
  download: <HiOutlineArrowDownTray />,
  history: <HiOutlineClock />,
  reports: <HiOutlineChartBar />,
  menu: <HiOutlineBars3 />,
  close: <HiOutlineXMark />,
  chevronLeft: <HiOutlineChevronLeft />,
  chevronRight: <HiOutlineChevronRight />,
  chevronDown: <HiOutlineChevronDown />,
  organization: <HiOutlineBuildingOffice2 />,

  // --- ÍCONES ADICIONADOS ---
  userCircle: <HiOutlineUserCircle />,
  user: <HiOutlineUser />,
};