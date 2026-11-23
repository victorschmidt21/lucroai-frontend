import type { IconComponent } from '@/shared/ui/icons/icone';
import {
  IconConfiguracoes,
  IconCustos,
  IconEstoque,
  IconGastos,
  IconHome,
  IconInsumos,
  IconProducao,
  IconReceitas,
  IconVendas,
} from '@/shared/ui/icons/menu';

export type ItemMenu = {
  label: string;
  href: string;
  icone: IconComponent;
};

/**
 * Os oito destinos fixos, na ordem da barra inferior do mobile
 * (lib/core/presentation/pages/main_screen.dart), com os nomes de cozinha da
 * FE-57 (docs/marca.md#voz-e-tom): só o texto muda, as rotas continuam. Sem
 * perfis: todo usuário vê todos (docs/security.md#proteção-de-rotas).
 */
export const ITENS_MENU: readonly ItemMenu[] = [
  { label: 'Início', href: '/', icone: IconHome },
  { label: 'Ingredientes', href: '/insumos', icone: IconInsumos },
  { label: 'Receitas', href: '/receitas', icone: IconReceitas },
  { label: 'Custos', href: '/custos', icone: IconCustos },
  { label: 'Vendas', href: '/vendas', icone: IconVendas },
  { label: 'Estoque', href: '/estoque', icone: IconEstoque },
  { label: 'Fornadas', href: '/producoes', icone: IconProducao },
  { label: 'Contas do mês', href: '/gastos-indiretos', icone: IconGastos },
];

/** Configurações de custo (FE-41), "Ajustes de preço" desde a FE-57. */
export const ITEM_CONFIGURACOES: ItemMenu = {
  label: 'Ajustes de preço',
  href: '/configuracoes',
  icone: IconConfiguracoes,
};

/** Itens do menu lateral: os oito destinos e os ajustes de preço. */
export const ITENS_MENU_LATERAL: readonly ItemMenu[] = [
  ...ITENS_MENU,
  ITEM_CONFIGURACOES,
];

/** Destinos que ficam sempre na barra inferior do celular (FE-57). */
const ROTAS_DA_BARRA = new Set(['/', '/receitas', '/vendas', '/estoque']);

/**
 * Barra inferior do celular (FE-57): com o rótulo de 12px, os oito itens não
 * cabem em 360px. Ficam Início, Receitas, Vendas e Estoque, e o botão "Mais".
 */
export const ITENS_BARRA_INFERIOR: readonly ItemMenu[] = ITENS_MENU.filter(
  (item) => ROTAS_DA_BARRA.has(item.href),
);

/** O resto do menu lateral, na gaveta "Mais" da barra inferior. */
export const ITENS_MAIS: readonly ItemMenu[] = ITENS_MENU_LATERAL.filter(
  (item) => !ROTAS_DA_BARRA.has(item.href),
);

function contemRota(href: string, pathname: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Item do menu da tela atual: `/receitas/nova` marca Receitas. Telas fora do
 * menu (`/simulacao`, aberta pelo painel) não marcam nenhum.
 */
export function getItemAtivo(pathname: string) {
  return ITENS_MENU_LATERAL.find((item) => contemRota(item.href, pathname));
}
