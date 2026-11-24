'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { canaisOptions } from '@/features/configuracoes/api/configuracoes.queries';
import type { Venda } from '@/shared/api/contracts/sales';
import { totalDaVenda } from '@/shared/domain/vendas';
import { hrefComFiltros } from '@/shared/api/filtros';
import { buttonClasses } from '@/shared/ui/button';
import { IconProducao } from '@/shared/ui/icons/menu';
import { PageHeader } from '@/shared/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { DicaNaHora } from '@/features/aprender/components/dica-na-hora';
import { useCreateVenda } from '../hooks/use-create-venda';
import {
  canalPadrao,
  toCreateVendaBody,
  type ItemCarrinho,
} from '../schemas/item-venda.schema';
import type { VendasSearch } from '../schemas/vendas-search.schema';
import { AdicionarProdutoCard } from './adicionar-produto-card';
import { CarrinhoCard } from './carrinho-card';
import { ConfirmacaoVenda } from './confirmacao-venda';
import { HistoricoVendas } from './historico-vendas';

type Props = {
  /** Aba e filtros do histórico da URL, já validados pela página. */
  busca: VendasSearch;
};

/** Tela de vendas. Origem: vendas_page.dart. */
export function VendasTela({ busca }: Props) {
  const { aba } = busca;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrar = useCreateVenda();
  // O carrinho fica aqui, e não na aba, para sobreviver à troca de aba.
  // Nunca vai para o navegador: recarregar a página o descarta.
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const proximaChave = useRef(0);
  // "Onde vendeu?" (FE-46): `undefined` segue o padrão (Balcão) até a escolha.
  const canais = useQuery(canaisOptions());
  const [canalEscolhido, setCanalEscolhido] = useState<number | null>();
  const canalId =
    canalEscolhido === undefined
      ? canalPadrao(canais.data ?? [])
      : canalEscolhido;

  function trocarAba(valor: string) {
    router.replace(
      hrefComFiltros(pathname, searchParams, {
        aba: valor === 'registrar' ? null : valor,
      }),
      { scroll: false },
    );
  }

  // A venda nasce `PENDENTE` e abre a confirmação (`_showConfirmacaoSheet`).
  const [emConfirmacao, setEmConfirmacao] = useState<Venda | null>(null);
  // A última venda concluída aqui, para a dica da taxa do canal (FE-68).
  const [anotada, setAnotada] = useState<Venda | null>(null);
  const canalDaAnotada = anotada
    ? canais.data?.find((canal) => canal.id === anotada.canalId)
    : undefined;

  function registrarVenda() {
    if (carrinho.length === 0) return;

    registrar.mutate(toCreateVendaBody(carrinho, canalId), {
      onSuccess: (venda) => {
        setCarrinho([]);
        // A próxima venda volta ao Balcão, para não ir ao iFood sem querer.
        setCanalEscolhido(undefined);
        setEmConfirmacao(venda);
      },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Vendas"
        subtitle="Registre vendas e acompanhe o histórico"
        actions={
          <Link href="/producoes" className={buttonClasses('secundario')}>
            <IconProducao className="size-5" />
            Fornadas
          </Link>
        }
      />
      <DicaNaHora
        tela="vendas"
        vendaAnotada={
          anotada && canalDaAnotada
            ? {
                canal: canalDaAnotada.nome,
                comissao: canalDaAnotada.comissaoPercentual,
                total: totalDaVenda(anotada),
              }
            : null
        }
      />

      <Tabs value={aba} onValueChange={trocarAba}>
        <TabsList aria-label="Seções de vendas">
          <TabsTrigger value="registrar">Registrar</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent
          value="registrar"
          className="grid items-start gap-4 lg:grid-cols-2"
        >
          <AdicionarProdutoCard
            bloqueado={registrar.isPending}
            canal={{
              id: canalId,
              canais: canais.data ?? [],
              carregando: canais.isPending,
              erro: canais.isError,
              travado: carrinho.length > 0 || registrar.isPending,
              onChange: setCanalEscolhido,
            }}
            onAdicionar={(item, receita) => {
              const chave = proximaChave.current;
              proximaChave.current += 1;
              registrar.reset();
              setCarrinho((atual) => [
                ...atual,
                { ...item, chave, nome: receita.nome },
              ]);
            }}
          />
          <CarrinhoCard
            itens={carrinho}
            registrando={registrar.isPending}
            erro={registrar.error}
            onRegistrar={registrarVenda}
            onRemover={(chave) => {
              registrar.reset();
              setCarrinho((atual) => atual.filter((i) => i.chave !== chave));
            }}
          />
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoVendas filtros={busca} onConfirmar={setEmConfirmacao} />
        </TabsContent>
      </Tabs>

      <ConfirmacaoVenda
        venda={emConfirmacao}
        onFechar={() => setEmConfirmacao(null)}
        onConcluida={setAnotada}
      />
    </div>
  );
}
