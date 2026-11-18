'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Alert } from '@/shared/ui/alert';
import {
  Badge,
  MetodoRateioBadge,
  StatusEstoqueBadge,
  StatusVendaBadge,
} from '@/shared/ui/badge';
import { Button, buttonClasses, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Chip, ToggleChip } from '@/shared/ui/chip';
import { Combobox } from '@/shared/ui/combobox';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DateRangePicker, type Periodo } from '@/shared/ui/date-picker';
import { Dialog, DialogClose } from '@/shared/ui/dialog';
import { Drawer } from '@/shared/ui/drawer';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import {
  IconAdicionar,
  IconAlerta,
  IconAtualizar,
  IconBusca,
  IconCalendario,
  IconCheck,
  IconChevronBaixo,
  IconDinheiro,
  IconEditar,
  IconErro,
  IconExcluir,
  IconFechar,
  IconFiltro,
  IconInfo,
  IconMaisOpcoes,
  IconSeta,
  IconSucesso,
  IconTendencia,
  IconVazio,
} from '@/shared/ui/icons/acoes';
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
import { Input } from '@/shared/ui/input';
import { Logo } from '@/shared/ui/logo';
import { NumberInput } from '@/shared/ui/number-input';
import { PageHeader } from '@/shared/ui/page-header';
import { ProgressBar } from '@/shared/ui/progress-bar';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Select } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Slider } from '@/shared/ui/slider';
import { Spinner } from '@/shared/ui/spinner';
import { StatCard } from '@/shared/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';
import { ToastProvider, useToast } from '@/shared/ui/toast';

const CORES = [
  { nome: 'bg', classe: 'bg-bg', uso: 'fundo da página' },
  { nome: 'bg-alt', classe: 'bg-bg-alt', uso: 'fundo de telas internas' },
  { nome: 'surface', classe: 'bg-surface', uso: 'cartões' },
  { nome: 'surface-alt', classe: 'bg-surface-alt', uso: 'campos' },
  {
    nome: 'surface-raised',
    classe: 'bg-surface-raised',
    uso: 'Dialog, Drawer, Toast',
  },
  { nome: 'border', classe: 'bg-border', uso: 'bordas' },
  { nome: 'border-strong', classe: 'bg-border-strong', uso: 'divisores' },
  { nome: 'ink', classe: 'bg-ink', uso: 'texto principal' },
  { nome: 'ink-muted', classe: 'bg-ink-muted', uso: 'texto secundário' },
  { nome: 'ink-subtle', classe: 'bg-ink-subtle', uso: 'subtítulos' },
  { nome: 'accent', classe: 'bg-accent', uso: 'destaque e foco' },
  { nome: 'accent-strong', classe: 'bg-accent-strong', uso: 'botão primário' },
  { nome: 'on-accent', classe: 'bg-on-accent', uso: 'texto sobre laranja' },
  { nome: 'success', classe: 'bg-success', uso: 'Adequado, Concluída' },
  { nome: 'warning', classe: 'bg-warning', uso: 'Baixo, Pendente' },
  { nome: 'danger', classe: 'bg-danger', uso: 'erro, Crítico' },
  { nome: 'danger-strong', classe: 'bg-danger-strong', uso: 'botão de perigo' },
  { nome: 'on-danger', classe: 'bg-on-danger', uso: 'texto sobre vermelho' },
];

const RAIOS = [
  { nome: 'radius-sm (8px)', classe: 'rounded-sm', uso: 'badges e chips' },
  { nome: 'radius-md (12px)', classe: 'rounded-md', uso: 'cartões e campos' },
  { nome: 'radius-lg (14px)', classe: 'rounded-lg', uso: 'resumos' },
  { nome: 'radius-xl (18px)', classe: 'rounded-xl', uso: 'Dialog e Drawer' },
];

const ICONES_MENU: [string, IconComponent][] = [
  ['Home', IconHome],
  ['Insumos', IconInsumos],
  ['Receitas', IconReceitas],
  ['Custos', IconCustos],
  ['Vendas', IconVendas],
  ['Estoque', IconEstoque],
  ['Produção', IconProducao],
  ['Gastos', IconGastos],
];

const ICONES_ACOES: [string, IconComponent][] = [
  ['Adicionar', IconAdicionar],
  ['Editar', IconEditar],
  ['Excluir', IconExcluir],
  ['Fechar', IconFechar],
  ['Busca', IconBusca],
  ['Filtro', IconFiltro],
  ['Atualizar', IconAtualizar],
  ['Calendário', IconCalendario],
  ['Mais opções', IconMaisOpcoes],
  ['Seta', IconSeta],
  ['Chevron', IconChevronBaixo],
  ['Check', IconCheck],
  ['Sucesso', IconSucesso],
  ['Info', IconInfo],
  ['Alerta', IconAlerta],
  ['Erro', IconErro],
  ['Vazio', IconVazio],
  ['Dinheiro', IconDinheiro],
  ['Tendência', IconTendencia],
];

const RECEITAS = [
  { value: '1', label: 'Pão Francês' },
  { value: '2', label: 'Bolo de Chocolate' },
  { value: '3', label: 'Brigadeiro Gourmet' },
  { value: '4', label: 'Quindim' },
];

// Os formatadores de `shared/format/` chegam na FE-05.
const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const GASTOS = [
  'Energia Elétrica',
  'Aluguel do Espaço',
  'Gás de Cozinha (P45)',
  'Material de Embalagem',
];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section-label text-ink-muted">{titulo}</h2>
      {children}
    </section>
  );
}

function ExemploDeToast() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secundario"
        onClick={() => toast.success('Insumo criado com sucesso.')}
      >
        Toast de sucesso
      </Button>
      <Button
        variant="secundario"
        onClick={() => toast.error('Não foi possível salvar o insumo.')}
      >
        Toast de erro
      </Button>
      <Button
        variant="secundario"
        onClick={() => toast.info('Atualizando o estoque.')}
      >
        Toast informativo
      </Button>
    </div>
  );
}

function ExemploDeCampos() {
  const [receita, setReceita] = useState<string | null>('2');
  const [periodo, setPeriodo] = useState<Periodo>({
    inicio: '2026-11-01',
    fim: '2026-11-30',
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input label="Nome" required hint="Como aparece nas listagens." />
      <Input
        label="Buscar insumo"
        type="search"
        icon={<IconBusca className="size-5" />}
      />
      <NumberInput label="Valor pago" prefixo="R$" defaultValue="15,00" />
      <NumberInput label="Quantidade" sufixo="kg" defaultValue="5" />
      <NumberInput
        label="Margem de lucro"
        sufixo="%"
        defaultValue="0"
        error="Informe uma margem maior que zero"
      />
      <Select label="Unidade" defaultValue="KG">
        <option value="G">g</option>
        <option value="KG">kg</option>
        <option value="ML">ml</option>
        <option value="L">L</option>
        <option value="UN">un</option>
      </Select>
      <Combobox
        label="Receita"
        placeholder="Escolha uma receita"
        options={RECEITAS}
        value={receita}
        onValueChange={setReceita}
      />
      <Textarea label="Observações" rows={3} />
      <Checkbox label="Usar todos os gastos indiretos" defaultChecked />
      <DateRangePicker
        legend="Período"
        value={periodo}
        onChange={setPeriodo}
        className="md:col-span-2"
      />
    </div>
  );
}

function ExemploDeSelecao() {
  const [filtro, setFiltro] = useState<'todos' | 'baixo'>('todos');
  const [preco, setPreco] = useState(150);
  const [gastos, setGastos] = useState<string[]>([GASTOS[0]]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-body text-ink-muted">Status</p>
        <SegmentedControl
          aria-label="Status"
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'baixo', label: 'Baixo' },
          ]}
          value={filtro}
          onValueChange={setFiltro}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-body text-ink-muted">Gastos indiretos</p>
        <div className="flex flex-wrap gap-2">
          {GASTOS.map((gasto) => (
            <ToggleChip
              key={gasto}
              selected={gastos.includes(gasto)}
              onSelectedChange={(selecionado) =>
                setGastos((atuais) =>
                  selecionado
                    ? [...atuais, gasto]
                    : atuais.filter((item) => item !== gasto),
                )
              }
            >
              {gasto}
            </ToggleChip>
          ))}
          <Chip>Matéria-prima</Chip>
        </div>
      </div>
      <Card className="max-w-md">
        <Slider
          label="Preço de venda"
          hint="+25,0% em relação ao preço atual"
          value={preco}
          min={50}
          max={300}
          step={5}
          formatValue={(centavos) => MOEDA.format(centavos / 100)}
          onValueChange={setPreco}
        />
      </Card>
    </div>
  );
}

export function DesignSystemShowcase() {
  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-6">
          <Logo />
          <PageHeader
            title="Design system"
            subtitle="Tokens e componentes base do LucroAI"
            actions={
              <Button>
                <IconAdicionar className="size-5" />
                Novo insumo
              </Button>
            }
          />
        </div>

        <Secao titulo="Cores">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {CORES.map(({ nome, classe, uso }) => (
              <li key={nome} className="flex flex-col gap-1">
                <span
                  className={`h-14 rounded-md border border-border-strong ${classe}`}
                />
                <span className="text-small font-semibold wrap-anywhere">
                  {nome}
                </span>
                <span className="text-caption text-ink-muted">{uso}</span>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Tipografia">
          <div className="flex flex-col gap-3">
            <p className="text-display-lg text-accent">R$ 0,81</p>
            <p className="text-display">R$ 1.234,56 (display)</p>
            <p className="text-heading">Insumos (heading)</p>
            <p className="text-title">Novo insumo (title)</p>
            <p className="text-subtitle text-ink-subtle">
              Gerencie quantidade, valor pago e custo unitário (subtitle)
            </p>
            <p className="text-section-label text-ink-muted">
              Custos invisíveis (section-label)
            </p>
            <p className="text-body">body: Roboto Regular para textos.</p>
            <p className="text-small text-ink-muted">small: texto de apoio.</p>
            <p className="text-caption text-ink-muted">
              caption: legendas e metadados.
            </p>
            <p className="text-body">
              Pesos: <span className="font-normal">400</span>{' '}
              <span className="font-medium">500</span>{' '}
              <span className="font-semibold">600</span>{' '}
              <span className="font-bold">700</span>
            </p>
          </div>
        </Secao>

        <Secao titulo="Raios">
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {RAIOS.map(({ nome, classe, uso }) => (
              <li key={nome} className="flex flex-col gap-1">
                <span
                  className={`h-16 border border-border-strong bg-surface ${classe}`}
                />
                <span className="text-small font-semibold">{nome}</span>
                <span className="text-caption text-ink-muted">{uso}</span>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Ícones">
          <ul className="grid grid-cols-4 gap-4 sm:grid-cols-8">
            {ICONES_MENU.map(([nome, Icone]) => (
              <li
                key={nome}
                className="flex flex-col items-center gap-1 text-ink-muted"
              >
                <Icone className="size-[22px]" />
                <span className="text-caption">{nome}</span>
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-4 gap-4 sm:grid-cols-8">
            {ICONES_ACOES.map(([nome, Icone]) => (
              <li
                key={nome}
                className="flex flex-col items-center gap-1 text-ink"
              >
                <Icone />
                <span className="text-caption text-ink-muted">{nome}</span>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Botões">
          <div className="flex flex-wrap gap-2">
            <Button>Primário</Button>
            <Button variant="secundario">Secundário</Button>
            <Button variant="perigo">Perigo</Button>
            <Button variant="fantasma">Fantasma</Button>
            <Button disabled>Desabilitado</Button>
            <Button loading>Salvando</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secundario">
              <IconAtualizar className="size-4" />
              Atualizar
            </Button>
            <Button variant="fantasma" size="compacto">
              <IconFiltro className="size-4" />
              Filtros
            </Button>
            <IconButton aria-label="Editar Farinha de Trigo">
              <IconEditar />
            </IconButton>
            <IconButton aria-label="Excluir Farinha de Trigo">
              <IconExcluir />
            </IconButton>
          </div>
        </Secao>

        <Secao titulo="Campos">
          <ExemploDeCampos />
          <Alert>Não foi possível salvar o insumo.</Alert>
        </Secao>

        <Secao titulo="Seleção">
          <ExemploDeSelecao />
        </Secao>

        <Secao titulo="Cartões">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard
              title="Faturamento"
              value="R$ 1.234,56"
              detail="Período atual"
              detailTone="success"
              icon={<IconDinheiro />}
            />
            <StatCard
              title="Lucro líquido"
              value="-R$ 12,30"
              detail="Margem -1,0%"
              detailTone="danger"
              icon={<IconTendencia />}
            />
            <StatCard
              title="Vendas"
              value="12"
              detail="Últimos 7 dias"
              icon={<IconVendas />}
            />
            <StatCard
              title="Estoque baixo"
              value="0"
              detail="Itens críticos"
              detailTone="success"
              icon={<IconAlerta />}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Rendimento">
              <p className="text-body text-ink-muted">
                Cartão com rótulo de seção, como no cálculo real.
              </p>
            </Card>
            <Card variant="resumo">
              <p className="text-small text-ink-muted">Total vendido</p>
              <p className="text-title text-accent">R$ 3.480,00</p>
            </Card>
          </div>
        </Secao>

        <Secao titulo="Status">
          <div className="flex flex-wrap gap-2">
            <StatusEstoqueBadge status="critico" />
            <StatusEstoqueBadge status="baixo" />
            <StatusEstoqueBadge status="adequado" />
            <StatusVendaBadge status="PENDENTE" />
            <StatusVendaBadge status="CONCLUIDA" />
            <StatusVendaBadge status="CANCELADA" />
            <MetodoRateioBadge metodo="PROPORCIONAL" />
            <Badge tone="destaque">Destaque</Badge>
          </div>
          <div className="flex max-w-md flex-col gap-3">
            <ProgressBar
              aria-label="Estoque de Farinha de Trigo"
              value={0.86}
              valueText="86%"
              tone="adequado"
            />
            <ProgressBar
              aria-label="Estoque de Ovos"
              value={0.3}
              valueText="30%"
              tone="critico"
            />
          </div>
        </Secao>

        <Secao titulo="Sobreposições">
          <div className="flex flex-wrap gap-2">
            <Dialog
              title="Novo insumo"
              description="Informe a quantidade e o valor pago."
              trigger={<Button variant="secundario">Abrir Dialog</Button>}
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secundario">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Salvar</Button>
                  </DialogClose>
                </>
              }
            >
              <Input label="Nome do insumo" />
            </Dialog>
            <Drawer
              title="Filtros"
              trigger={<Button variant="secundario">Abrir Drawer</Button>}
              footer={
                <DialogClose asChild>
                  <Button>Aplicar filtros</Button>
                </DialogClose>
              }
            >
              <Input label="Buscar por nome" />
            </Drawer>
            <ConfirmDialog
              title="Excluir gasto"
              description='Deseja excluir "Energia Elétrica"? Isso afetará o custo de todas as receitas.'
              confirmLabel="Excluir"
              trigger={
                <Button variant="secundario">Abrir ConfirmDialog</Button>
              }
              onConfirm={() => undefined}
            />
          </div>
          <ExemploDeToast />
        </Secao>

        <Secao titulo="Abas">
          <Tabs defaultValue="registrar">
            <TabsList aria-label="Seções de vendas">
              <TabsTrigger value="registrar">Registrar</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="registrar">Carrinho da venda.</TabsContent>
            <TabsContent value="historico">Vendas do período.</TabsContent>
          </Tabs>
        </Secao>

        <Secao titulo="Estados">
          <div className="flex flex-col gap-4">
            <Skeleton aria-label="Carregando insumos" className="h-16" />
            <Spinner />
            <EmptyState
              title="Nenhum insumo encontrado."
              description="Cadastre o primeiro insumo para começar."
              action={<Button>Cadastrar insumo</Button>}
            />
            <ErrorState
              title="Não foi possível carregar os insumos."
              message="Verifique sua conexão."
              onRetry={() => undefined}
            />
          </div>
        </Secao>

        <Secao titulo="Listagem e formulário">
          <p className="max-w-prose text-body text-ink-muted">
            ListPage com busca na URL, FormDialog com os campos numéricos
            brasileiros, Form em página e ConfirmDialog, funcionando com uma API
            em memória.
          </p>
          <Link
            href="/design-system/listagem"
            className={buttonClasses('secundario', 'self-start')}
          >
            Abrir o exemplo de listagem e formulário
          </Link>
        </Secao>
      </main>
    </ToastProvider>
  );
}
