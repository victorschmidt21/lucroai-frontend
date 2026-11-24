'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  FormDecimalInput,
  FormInput,
  FormIntegerInput,
  FormMoneyInput,
} from '@/shared/ui/form';
import { IconAdicionar } from '@/shared/ui/icons/acoes';
import { PageHeader } from '@/shared/ui/page-header';
import { useToast } from '@/shared/ui/toast';
import { calcularCustoReal, lerCamposCustoReal } from '../custos.calculos';
import { Termo } from '@/features/aprender/components/termo';
import { useSimulacoesSalvas } from '../hooks/use-simulacoes-salvas';
import {
  custoRealFormSchema,
  custoRealFormVazio,
  toCustoRealFormInput,
  type CustoRealFormInput,
  type CustoRealFormValues,
} from '../schemas/custo-real-form.schema';
import { ResultadoCustoRealCard } from './resultado-custo-real';
import { SimulacoesSalvasCard } from './simulacoes-salvas-card';

/** Aba "Custos". Origem: calculo_real_screen.dart. Tela 100% local, sem API. */
export function CalculoRealTela() {
  const toast = useToast();
  const { simulacoes, salvar } = useSimulacoesSalvas();
  const form = useForm<CustoRealFormInput, unknown, CustoRealFormValues>({
    resolver: zodResolver(custoRealFormSchema),
    defaultValues: custoRealFormVazio(),
    shouldFocusError: true,
  });
  const campos = useWatch({ control: form.control });
  const resultado = calcularCustoReal(
    lerCamposCustoReal({ ...custoRealFormVazio(), ...campos }),
  );

  const salvarSimulacao = form.handleSubmit((valores) => {
    const { custoTotal, custoPorUnidade } = calcularCustoReal(valores);

    salvar({ ...valores, custoTotal, custoPorUnidade });
    toast.success('Simulação salva.');
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Quanto custa de verdade"
        subtitle="O custo de cada unidade, com o que não aparece na receita"
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="lg:sticky lg:top-4 lg:order-2">
          <ResultadoCustoRealCard resultado={resultado} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:order-1">
          <FormProvider {...form}>
            <form
              noValidate
              aria-label="Cálculo real"
              onSubmit={(event) => void salvarSimulacao(event)}
              className="flex flex-col gap-4"
            >
              <Card title="Identificação">
                <FormInput name="nome" label="Nome da simulação" required />
              </Card>

              <Card title="Custo dos ingredientes">
                <FormMoneyInput
                  name="ingredientes"
                  label="Custo dos ingredientes"
                />
              </Card>

              <Card title={<Termo id="contas-do-mes">Custos invisíveis</Termo>}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormMoneyInput name="energia" label="Energia" />
                  <FormMoneyInput name="agua" label="Água" />
                  <FormMoneyInput name="gas" label="Gás" />
                  <FormDecimalInput name="horas" label="Horas" unidade="h" />
                </div>
                <FormMoneyInput
                  name="valorHora"
                  label="Valor/hora mão de obra"
                />
              </Card>

              <Card title="Rendimento">
                <FormIntegerInput
                  name="rendimento"
                  label="Unidades produzidas"
                  required
                />
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secundario"
                  onClick={() => form.reset(custoRealFormVazio())}
                >
                  <IconAdicionar className="size-5" />
                  Novo
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </FormProvider>

          <SimulacoesSalvasCard
            simulacoes={simulacoes}
            onAbrir={(simulacao) => form.reset(toCustoRealFormInput(simulacao))}
          />
        </div>
      </div>
    </div>
  );
}
