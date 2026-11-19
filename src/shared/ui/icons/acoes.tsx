import { criarIcone } from './icone';

// Ícones de ação e de estado, equivalentes aos Material Icons usados nas telas do mobile.

/** `Icons.add` */
export const IconAdicionar = criarIcone(
  'Adicionar',
  'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
);

/** `Icons.edit` */
export const IconEditar = criarIcone(
  'Editar',
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
);

/** `Icons.delete_outline` */
export const IconExcluir = criarIcone(
  'Excluir',
  'M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z',
);

/** `Icons.close` */
export const IconFechar = criarIcone(
  'Fechar',
  'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
);

/** `Icons.search` */
export const IconBusca = criarIcone(
  'Busca',
  'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
);

/** `Icons.expand_more` */
export const IconChevronBaixo = criarIcone(
  'ChevronBaixo',
  'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
);

/** `Icons.arrow_forward` */
export const IconSeta = criarIcone(
  'Seta',
  'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
);

/** `Icons.check` */
export const IconCheck = criarIcone(
  'Check',
  'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
);

/** `Icons.refresh` */
export const IconAtualizar = criarIcone(
  'Atualizar',
  'M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
);

/** `Icons.filter_list` */
export const IconFiltro = criarIcone(
  'Filtro',
  'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
);

/** `Icons.calendar_today` */
export const IconCalendario = criarIcone(
  'Calendario',
  'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V10h16v11zm0-13H4V5h16v3z',
);

/** `Icons.more_vert` */
export const IconMaisOpcoes = criarIcone(
  'MaisOpcoes',
  'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
);

/** `Icons.warning_amber_rounded` */
export const IconAlerta = criarIcone(
  'Alerta',
  'M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z',
);

/** `Icons.error_outline` */
export const IconErro = criarIcone(
  'Erro',
  'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
);

/** `Icons.check_circle_outline` */
export const IconSucesso = criarIcone(
  'Sucesso',
  'M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
);

/** `Icons.info_outline` */
export const IconInfo = criarIcone(
  'Info',
  'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
);

/** `Icons.inbox_outlined`, para os estados vazios */
export const IconVazio = criarIcone(
  'Vazio',
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z',
);

/** `Icons.attach_money` (indicador de faturamento) */
export const IconDinheiro = criarIcone(
  'Dinheiro',
  'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
);

/** `Icons.trending_up` (indicador de lucro) */
export const IconTendencia = criarIcone(
  'Tendencia',
  'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
);
