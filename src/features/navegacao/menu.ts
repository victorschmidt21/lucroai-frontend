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
 * (lib/core/presentation/pages/main_screen.dart). Sem perfis: todo usuário vê
 * todos (docs/security.md#proteção-de-rotas).
 */
export const ITENS_MENU: readonly ItemMenu[] = [
  { label: 'Home', href: '/', icone: IconHome },
  { label: 'Insumos', href: '/insumos', icone: IconInsumos },
  { label: 'Receitas', href: '/receitas', icone: IconReceitas },
  { label: 'Custos', href: '/custos', icone: IconCustos },
  { label: 'Vendas', href: '/vendas', icone: IconVendas },
  { label: 'Estoque', href: '/estoque', icone: IconEstoque },
  { label: 'Produção', href: '/producoes', icone: IconProducao },
  { label: 'Gastos', href: '/gastos-indiretos', icone: IconGastos },
];

/**
 * Configurações de custo (FE-41): só no menu lateral e na gaveta "Conta" do
 * celular, porque a barra inferior só tem espaço para os oito destinos.
 */
export const ITEM_CONFIGURACOES: ItemMenu = {
  label: 'Configurações de custo',
  href: '/configuracoes',
  icone: IconConfiguracoes,
};

/** Itens do menu lateral: os oito destinos e as configurações. */
export const ITENS_MENU_LATERAL: readonly ItemMenu[] = [
  ...ITENS_MENU,
  ITEM_CONFIGURACOES,
];

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
