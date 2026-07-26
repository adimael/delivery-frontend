export type OrderItemSelection = {
  id?: string;
  opcao_uuid?: string;
  nome?: string;
  name?: string;
  categoria?: string;
  quantidade?: number | string;
  preco_adicional?: number | string;
};

export type DetailedOrderItem = {
  id?: string;
  quantidade: number | string;
  produto_nome?: string;
  preco_unitario?: number | string;
  preco_adicionais?: number | string;
  preco_total: number | string;
  variacao_nome?: string | null;
  tipo_variacao?: string | null;
  selecoes?: OrderItemSelection[] | string | null;
  observacoes?: string | null;
  customizations?: {
    selections?: OrderItemSelection[];
    variations?: Record<string, {
      id?: string;
      nome?: string;
      name?: string;
    }>;
    notes?: string;
  } | null;
};

const money = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const parseJson = (value: unknown): any => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const selectionsFromItem = (item: DetailedOrderItem): OrderItemSelection[] => {
  if (Array.isArray(item.customizations?.selections)) {
    return item.customizations.selections;
  }

  const structured = parseJson(item.selecoes);
  if (Array.isArray(structured)) return structured;

  const legacy = parseJson(item.observacoes);
  const selections = legacy?.customizations?.selections;
  return Array.isArray(selections) ? selections : [];
};

const notesFromItem = (item: DetailedOrderItem): string => {
  if (item.customizations?.notes) {
    return String(item.customizations.notes).trim();
  }
  if (!item.observacoes) return '';
  const parsed = parseJson(item.observacoes);
  if (!parsed) return item.observacoes;
  return String(parsed?.customizations?.notes || parsed?.observacoes || '').trim();
};

const variationFromItem = (item: DetailedOrderItem): string[] => {
  const currentVariations = item.customizations?.variations;
  if (currentVariations && typeof currentVariations === 'object') {
    return Object.entries(currentVariations).map(([type, value]) =>
      `${type}: ${value?.nome || value?.name || 'Selecionada'}`,
    );
  }

  if (item.variacao_nome) {
    return [`${item.tipo_variacao || 'Variação'}: ${item.variacao_nome}`];
  }
  const parsed = parseJson(item.observacoes);
  const variations = parsed?.customizations?.variations;
  if (!variations || typeof variations !== 'object') return [];
  return Object.entries(variations).map(([type, value]: [string, any]) =>
    `${type}: ${value?.nome || value?.name || 'Selecionada'}`,
  );
};

export const OrderItemDetails = ({ item }: { item: DetailedOrderItem }) => {
  const groups = selectionsFromItem(item).reduce<Record<string, OrderItemSelection[]>>(
    (result, selection) => {
      const category = selection.categoria || 'Opções selecionadas';
      result[category] = [...(result[category] || []), selection];
      return result;
    },
    {},
  );
  const variations = variationFromItem(item);
  const notes = notesFromItem(item);

  return (
    <article className="rounded-xl border bg-background p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-base">
            {item.quantidade}x {item.produto_nome || 'Produto'}
          </strong>
          <span className="text-muted-foreground">
            Unitário: {money(item.preco_unitario)}
          </span>
        </div>
        <strong className="whitespace-nowrap">{money(item.preco_total)}</strong>
      </div>

      {variations.length > 0 && (
        <section className="mt-3 border-t pt-3">
          <strong className="block text-xs uppercase tracking-wide text-muted-foreground">
            Variações
          </strong>
          {variations.map((variation) => <p key={variation}>{variation}</p>)}
        </section>
      )}

      {Object.entries(groups).map(([category, selections]) => (
        <section key={category} className="mt-3 border-t pt-3">
          <strong className="block text-xs uppercase tracking-wide text-muted-foreground">
            {category}
          </strong>
          <ul className="mt-1 space-y-1">
            {selections.map((selection, index) => (
              <li
                key={selection.opcao_uuid || selection.id || `${category}-${index}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {Number(selection.quantidade || 1)}x{' '}
                  {selection.nome || selection.name || 'Opção'}
                </span>
                {Number(selection.preco_adicional || 0) > 0 && (
                  <span>
                    +{money(
                      Number(selection.preco_adicional)
                        * Number(selection.quantidade || 1),
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {notes && (
        <section className="mt-3 rounded-lg bg-muted p-2">
          <strong>Observação:</strong> {notes}
        </section>
      )}
    </article>
  );
};
