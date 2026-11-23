import ArrowDown from 'lucide-react/icons/arrow-down';
import ArrowUp from 'lucide-react/icons/arrow-up';
import Banknote from 'lucide-react/icons/banknote';
import Bell from 'lucide-react/icons/bell';
import Calendar from 'lucide-react/icons/calendar';
import Check from 'lucide-react/icons/check';
import ChevronDown from 'lucide-react/icons/chevron-down';
import ChevronRight from 'lucide-react/icons/chevron-right';
import CircleAlert from 'lucide-react/icons/circle-alert';
import CircleCheck from 'lucide-react/icons/circle-check';
import Construction from 'lucide-react/icons/construction';
import EllipsisVertical from 'lucide-react/icons/ellipsis-vertical';
import Eye from 'lucide-react/icons/eye';
import EyeOff from 'lucide-react/icons/eye-off';
import FlaskConical from 'lucide-react/icons/flask-conical';
import History from 'lucide-react/icons/history';
import Inbox from 'lucide-react/icons/inbox';
import Info from 'lucide-react/icons/info';
import ListFilter from 'lucide-react/icons/list-filter';
import Lock from 'lucide-react/icons/lock';
import LogOut from 'lucide-react/icons/log-out';
import Mail from 'lucide-react/icons/mail';
import Pencil from 'lucide-react/icons/pencil';
import Plus from 'lucide-react/icons/plus';
import RefreshCw from 'lucide-react/icons/refresh-cw';
import Search from 'lucide-react/icons/search';
import Trash2 from 'lucide-react/icons/trash-2';
import TrendingUp from 'lucide-react/icons/trending-up';
import TriangleAlert from 'lucide-react/icons/triangle-alert';
import User from 'lucide-react/icons/user';
import X from 'lucide-react/icons/x';
import { criarIcone } from './icone';

// Ícones de ação e de estado, em contorno de 2px (FE-56, docs/ui.md#ícones).

export const IconAdicionar = criarIcone('Adicionar', Plus);
export const IconEditar = criarIcone('Editar', Pencil);
export const IconExcluir = criarIcone('Excluir', Trash2);
/** Simulação de cenário (a "prova" da receita) */
export const IconSimular = criarIcone('Simular', FlaskConical);
export const IconFechar = criarIcone('Fechar', X);
export const IconBusca = criarIcone('Busca', Search);
export const IconChevronBaixo = criarIcone('ChevronBaixo', ChevronDown);
/** Links do tipo "Ver tudo" */
export const IconSeta = criarIcone('Seta', ChevronRight);
export const IconCheck = criarIcone('Check', Check);
export const IconAtualizar = criarIcone('Atualizar', RefreshCw);
export const IconFiltro = criarIcone('Filtro', ListFilter);
export const IconCalendario = criarIcone('Calendario', Calendar);
export const IconMaisOpcoes = criarIcone('MaisOpcoes', EllipsisVertical);
/** Avisos ao entrar (`IndicadorAvisos`, FE-47) */
export const IconAvisos = criarIcone('Avisos', Bell);
export const IconAlerta = criarIcone('Alerta', TriangleAlert);
export const IconErro = criarIcone('Erro', CircleAlert);
export const IconSucesso = criarIcone('Sucesso', CircleCheck);
export const IconInfo = criarIcone('Info', Info);
/** Estados vazios */
export const IconVazio = criarIcone('Vazio', Inbox);
/** Indicador de faturamento */
export const IconDinheiro = criarIcone('Dinheiro', Banknote);
/** Indicador de lucro */
export const IconTendencia = criarIcone('Tendencia', TrendingUp);
/** Campo de e-mail do login */
export const IconEmail = criarIcone('Email', Mail);
/** Campo de senha do login */
export const IconCadeado = criarIcone('Cadeado', Lock);
/** "Mostrar senha" */
export const IconMostrar = criarIcone('Mostrar', Eye);
/** "Ocultar senha" */
export const IconOcultar = criarIcone('Ocultar', EyeOff);
/** "Sair" */
export const IconSair = criarIcone('Sair', LogOut);
/** Menu da conta no celular */
export const IconConta = criarIcone('Conta', User);
/** Telas provisórias */
export const IconConstrucao = criarIcone('Construcao', Construction);
/** Entrada de estoque */
export const IconEntrada = criarIcone('Entrada', ArrowDown);
/** Saída de estoque */
export const IconSaida = criarIcone('Saida', ArrowUp);
export const IconHistorico = criarIcone('Historico', History);
