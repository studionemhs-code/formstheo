## Objetivo
Melhorar a leitura e a visualização do catálogo na homepage pública, com foco em títulos de seção mais evidentes, mais respiro entre seções e imagens maiores/mais legíveis. Confirmar que a página não exige login.

## Acesso público — verificação
A homepage (`src/routes/index.tsx`) fica fora de `_authenticated/` e não usa `requireSupabaseAuth`. A validação do link compartilhável (`checkShareToken`) roda via `supabaseAdmin` no servidor, sem exigir sessão. Sem link (`?s=...`), a página abre normalmente; com link válido, também. Nenhuma mudança de auth é necessária — vou apenas confirmar durante a implementação.

## Melhorias visuais no catálogo

### 1. Títulos de seção (`SectionTitle` / `SubTitle` em `QuoteForm.tsx`)
- Aumentar hierarquia do `SectionTitle`: título maior, com pequena "eyebrow" (nº da etapa), linha divisória sutil dourada abaixo e mais margem inferior.
- `SubTitle` (usado antes de cada grade de produtos): virar um bloco com título maior, descrição curta opcional, e um traço/ícone à esquerda para ancorar visualmente. Aumentar `margin-top` entre grupos (`Modelo`, `Medalha de brinde`, `Marianas adicionais`, `Inox`, `Santos`, `Pingentes`).
- Contador de selecionados por seção (ex.: "3 selecionadas") ao lado do subtítulo, para dar feedback.

### 2. Espaçamento entre seções
- Aumentar `space-y` do `StepChains` e dos demais steps (de `space-y-8` para maior; `mt-6` entre `SubTitle`s vira `mt-10`).
- Aumentar padding interno do `Card` principal em telas maiores.
- Adicionar separadores discretos (`<hr>` com cor `border/50`) entre grupos de produtos na mesma cadeiazinha.

### 3. Grade de produtos (`ProductGrid.tsx`)
- Aumentar `gap` (de `gap-3` para `gap-4`/`gap-5`).
- Permitir 4 colunas em telas grandes (`lg:grid-cols-4`) para aproveitar melhor a largura em desktop, mantendo 2 no mobile e 3 no tablet.
- Aumentar levemente o padding do rótulo (`px-3 py-2.5`), com `text-sm` no desktop para leitura mais confortável.
- Melhorar contraste do estado selecionado (ring mais visível) e manter a imagem em `aspect-square` com leve zoom on hover (já existe).

### 4. Largura do container da homepage
- Ampliar `max-w-3xl` para `max-w-4xl` (ou `max-w-5xl` no step de cadeiazinhas) para dar mais respiro às grades de produtos sem comprometer a leitura de formulários.

### 5. Cabeçalho da homepage
- Pequeno ajuste opcional: aumentar espaçamento entre header e o card principal e reforçar contraste do subtítulo.

## Escopo técnico
Alterações restritas a UI/apresentação:
- `src/components/quote/QuoteForm.tsx` — `SectionTitle`, `SubTitle`, espaçamentos e contadores.
- `src/components/quote/ProductGrid.tsx` — grid responsivo, gaps e rótulos.
- `src/routes/index.tsx` — largura do container (se necessário).

Nada de banco, auth, lógica de envio, schema ou funções de servidor.

## Fora do escopo
- Redesign completo, novas cores, mudança de tipografia.
- Qualquer alteração no painel administrativo.
- Alterações no fluxo de link compartilhável.
