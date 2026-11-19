import type { IconComponent } from '@/shared/ui/icons/icone';
import {
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
  return ITENS_MENU.find((item) => contemRota(item.href, pathname));
}
