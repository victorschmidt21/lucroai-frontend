import Archive from 'lucide-react/icons/archive';
import BookOpen from 'lucide-react/icons/book-open';
import BookOpenText from 'lucide-react/icons/book-open-text';
import ChartPie from 'lucide-react/icons/chart-pie';
import CookingPot from 'lucide-react/icons/cooking-pot';
import Ellipsis from 'lucide-react/icons/ellipsis';
import House from 'lucide-react/icons/house';
import Receipt from 'lucide-react/icons/receipt';
import ShoppingBag from 'lucide-react/icons/shopping-bag';
import SlidersHorizontal from 'lucide-react/icons/sliders-horizontal';
import Wheat from 'lucide-react/icons/wheat';
import { criarIcone } from './icone';

// Ícones do menu com metáforas de cozinha (FE-56, docs/ui.md#ícones).

/** Início */
export const IconHome = criarIcone('Home', House);

/** Ingredientes (insumos) */
export const IconInsumos = criarIcone('Insumos', Wheat);

/** Receitas: o caderno de receitas */
export const IconReceitas = criarIcone('Receitas', BookOpen);

/** Custos: a fatia, quanto custa cada parte */
export const IconCustos = criarIcone('Custos', ChartPie);

/** Vendas: a sacola de entrega */
export const IconVendas = criarIcone('Vendas', ShoppingBag);

/** Estoque: a despensa */
export const IconEstoque = criarIcone('Estoque', Archive);

/** Fornadas (produção) */
export const IconProducao = criarIcone('Producao', CookingPot);

/** Contas do mês (gastos indiretos) */
export const IconGastos = criarIcone('Gastos', Receipt);

/** Aprender: o livro com as explicações (FE-67) */
export const IconAprender = criarIcone('Aprender', BookOpenText);

/** Ajustes de preço (configurações de custo) */
export const IconConfiguracoes = criarIcone('Configuracoes', SlidersHorizontal);

/** "Mais": a gaveta com o resto do menu na barra inferior (FE-57) */
export const IconMais = criarIcone('Mais', Ellipsis);
