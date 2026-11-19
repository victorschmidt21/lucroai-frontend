'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  FormProvider,
  get,
  useController,
  useForm,
  useFormContext,
  useFormState,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from 'react-hook-form';
import type { z } from 'zod';
import { getErrorMessage } from '@/shared/api/errors';
import { Alert } from './alert';
import { Button, buttonClasses } from './button';
import { Combobox } from './combobox';
import { Modal } from './dialog';
import { Input } from './input';
import {
  DecimalInput,
  IntegerInput,
  MoneyInput,
  PercentInput,
} from './number-input';
import { Select } from './select';
import { Textarea } from './textarea';
import { UnidadeSelect } from './unidade-select';

type FormBaseProps<Input extends FieldValues, Output> = {
  /** Zod: entrada como texto (o que o campo guarda), saída tipada (o que é enviado). */
  schema: z.ZodType<Output, Input>;
  defaultValues: DefaultValues<Input>;
  /**
   * Rejeite com o `ApiError` (`mutateAsync`, não `mutate`): a mensagem aparece num
   * `Alert` no topo do formulário, que continua preenchido.
   */
  onSubmit: (values: Output) => Promise<unknown> | void;
  /** "Salvar" na criação, "Atualizar" na edição. */
  submitLabel?: string;
  children: ReactNode;
};

type FormBodyProps<Input extends FieldValues, Output> = FormBaseProps<
  Input,
  Output
> & {
  cancel?: ReactNode;
};

/** Mesmo rodapé do `Dialog`: botões lado a lado e largos no celular, como no mobile. */
const RODAPE_CLASSES =
  'mt-2 flex flex-wrap justify-end gap-2 *:grow sm:*:grow-0';

function FormBody<Input extends FieldValues, Output>({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar',
  cancel,
  children,
}: FormBodyProps<Input, Output>) {
  const form = useForm<Input, unknown, Output>({
    // O resolver infere a entrada e a saída do schema; o cast só junta os genéricos.
    resolver: zodResolver(schema) as Resolver<Input, unknown, Output>,
    defaultValues,
    // Foco no primeiro campo inválido, na ordem em que aparecem.
    shouldFocusError: true,
  });
  const { errors, isSubmitting } = form.formState;

  const enviar = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => void enviar(event)}
        className="flex flex-col gap-4"
      >
        {errors.root?.message ? <Alert>{errors.root.message}</Alert> : null}
        {children}
        <div className={RODAPE_CLASSES}>
          {cancel}
          <Button type="submit" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

type FormProps<Input extends FieldValues, Output> = FormBaseProps<
  Input,
  Output
> & {
  /** Para onde "Cancelar" volta (páginas de receita). */
  cancelHref?: string;
  onCancel?: () => void;
};

/**
 * Formulário sem diálogo: páginas `/receitas/nova`, `/receitas/[receitaId]/editar`
 * e o cálculo real. Rótulo e erro ligados a cada campo, foco no primeiro campo
 * inválido e envio desabilitado enquanto a chamada não termina.
 */
export function Form<Input extends FieldValues, Output>({
  cancelHref,
  onCancel,
  ...props
}: FormProps<Input, Output>) {
  let cancel: ReactNode = null;

  if (cancelHref) {
    cancel = (
      <Link href={cancelHref} className={buttonClasses('secundario')}>
        Cancelar
      </Link>
    );
  } else if (onCancel) {
    cancel = (
      <Button variant="secundario" onClick={onCancel}>
        Cancelar
      </Button>
    );
  }

  return <FormBody {...props} cancel={cancel} />;
}

/**
 * Drawer de baixo no celular (como o `showModalBottomSheet` do mobile) e Dialog
 * centralizado a partir de `md`. Só CSS: o mesmo conteúdo serve aos dois, sem
 * depender da largura no servidor.
 */
const FORM_DIALOG_CLASSES =
  'inset-x-0 bottom-0 max-h-[90dvh] animate-gaveta-baixo rounded-t-xl pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:animate-subir md:rounded-xl md:pb-5';

type FormDialogProps<Input extends FieldValues, Output> = FormBaseProps<
  Input,
  Output
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
};

/**
 * Cadastro curto (insumo, gasto, entrada de estoque, produção) com "Cancelar" e a
 * ação primária. O formulário nasce a cada abertura, com os `defaultValues`; durante
 * o envio, o diálogo não fecha. Feche-o no `onSubmit`, depois do Toast de sucesso.
 */
export function FormDialog<Input extends FieldValues, Output>({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  ...props
}: FormDialogProps<Input, Output>) {
  const [isPending, setIsPending] = useState(false);

  async function enviar(values: Output) {
    setIsPending(true);

    try {
      await onSubmit(values);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal
      title={title}
      description={description}
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
      contentClassName={FORM_DIALOG_CLASSES}
    >
      <FormBody
        {...props}
        onSubmit={enviar}
        cancel={
          <Button
            variant="secundario"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        }
      />
    </Modal>
  );
}

/** Aceita caminho aninhado (`itens.0.quantidade`). */
function useFieldError(name: string) {
  const { errors } = useFormState({ name });
  const error = get(errors, name) as { message?: string } | undefined;

  return error?.message;
}

type NamedField<Props> = Omit<
  Props,
  'name' | 'error' | 'value' | 'defaultValue' | 'onChange' | 'onValueChange'
> & { name: string };

export function FormInput({
  name,
  ...props
}: NamedField<ComponentProps<typeof Input>>) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return <Input {...props} {...register(name)} error={error} />;
}

export function FormTextarea({
  name,
  ...props
}: NamedField<ComponentProps<typeof Textarea>>) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return <Textarea {...props} {...register(name)} error={error} />;
}

export function FormSelect({
  name,
  ...props
}: NamedField<ComponentProps<typeof Select>>) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return <Select {...props} {...register(name)} error={error} />;
}

export function FormUnidadeSelect({
  name,
  ...props
}: NamedField<ComponentProps<typeof UnidadeSelect>>) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return <UnidadeSelect {...props} {...register(name)} error={error} />;
}

export function FormCombobox({
  name,
  id,
  ...props
}: NamedField<ComponentProps<typeof Combobox>>) {
  const { field, fieldState } = useController({ name });
  const controlId = id ?? `campo-${name}`;

  // O Combobox não repassa `ref`: o foco no primeiro campo inválido usa o id.
  const { ref } = field;

  useEffect(() => {
    ref({ focus: () => document.getElementById(controlId)?.focus() });
  }, [ref, controlId]);

  return (
    <Combobox
      {...props}
      id={controlId}
      name={field.name}
      value={(field.value as string | null | undefined) ?? null}
      onValueChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

/** Liga um campo numérico (que guarda o texto digitado) ao formulário. */
function useCampoNumerico(name: string) {
  const { field, fieldState } = useController({ name });

  return {
    name: field.name,
    ref: field.ref,
    value: (field.value as string | null | undefined) ?? '',
    onValueChange: field.onChange,
    onBlur: field.onBlur,
    error: fieldState.error?.message,
  };
}

export function FormMoneyInput({
  name,
  ...props
}: NamedField<ComponentProps<typeof MoneyInput>>) {
  return <MoneyInput {...props} {...useCampoNumerico(name)} />;
}

export function FormDecimalInput({
  name,
  ...props
}: NamedField<ComponentProps<typeof DecimalInput>>) {
  return <DecimalInput {...props} {...useCampoNumerico(name)} />;
}

export function FormIntegerInput({
  name,
  ...props
}: NamedField<ComponentProps<typeof IntegerInput>>) {
  return <IntegerInput {...props} {...useCampoNumerico(name)} />;
}

export function FormPercentInput({
  name,
  ...props
}: NamedField<ComponentProps<typeof PercentInput>>) {
  return <PercentInput {...props} {...useCampoNumerico(name)} />;
}
