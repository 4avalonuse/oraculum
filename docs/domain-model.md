# ORACULUM — Modelo de Domínio

## Núcleo

WORKSPACE
- id
- nome
- descrição
- created_at
- updated_at

ASSET
- id
- symbol
- name
- metadata

DATASET
- id
- provider
- symbol
- kind
- interval
- currency

FRAME
- id
- workspace_id
- start
- end
- label

VARIABLE
- id
- name
- type
- source
- metadata

OBSERVATION
- variable_id
- timestamp
- value

EVENT
- id
- timestamp
- type
- title
- source
- impact
- metadata

RELATION
- id
- source_id
- target_id
- relation_type
- lag
- metadata

HYPOTHESIS
- id
- workspace_id
- statement
- status
- created_at
- updated_at

TEST
- id
- hypothesis_id
- external_system
- external_id
- version
- status
- result_reference

## Princípio importante

Nem todas essas entidades precisam virar tabelas imediatamente.

Primeiro definimos o domínio e os contratos. Depois persistimos o que realmente for necessário.

O modelo atual de D1 (datasets, candles, api_meta) continua como fundação de mercado. O modelo de investigação pode crescer separadamente.

## Integração

Cada produto externo deve ter:

- identificação do produto;
- versão;
- contrato de entrada;
- contrato de saída;
- referência ao Workspace;
- referência ao contexto temporal;
- estado/status.

Assim, o ORACULUM pode evoluir sem importar a implementação interna de outro produto.
