import Archive from 'lucide-react/icons/archive';
import BookOpen from 'lucide-react/icons/book-open';
import ChartPie from 'lucide-react/icons/chart-pie';
import CookingPot from 'lucide-react/icons/cooking-pot';
import House from 'lucide-react/icons/house';
import Receipt from 'lucide-react/icons/receipt';
import ShoppingBag from 'lucide-react/icons/shopping-bag';
import SlidersHorizontal from 'lucide-react/icons/sliders-horizontal';
import Wheat from 'lucide-react/icons/wheat';
import { criarIcone } from './icone';

// Ícones do menu com metáforas de cozinha (FE-56, docs/ui.md#ícones).

/** Início */
export const IconHome = criarIcone('Home', House);

/** Insumos: os ingredientes */
export const IconInsumos = criarIcone('Insumos', Wheat);

/** Receitas: o caderno de receitas */
export const IconReceitas = criarIcone('Receitas', BookOpen);

/** Custos: a fatia, quanto custa cada parte */
export const IconCustos = criarIcone('Custos', ChartPie);

/** Vendas: a sacola de entrega */
export const IconVendas = criarIcone('Vendas', ShoppingBag);

/** Estoque: a despensa */
export const IconEstoque = criarIcone('Estoque', Archive);

/** Produção: a fornada */
export const IconProducao = criarIcone('Producao', CookingPot);

/** Gastos indiretos: as contas da casa */
export const IconGastos = criarIcone('Gastos', Receipt);

/** Configurações de custo: os ajustes */
export const IconConfiguracoes = criarIcone('Configuracoes', SlidersHorizontal);
