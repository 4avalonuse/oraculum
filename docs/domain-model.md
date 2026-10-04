# ORACULUM — Modelo de Domínio

WORKSPACE: id, nome, descrição, created_at, updated_at.

ASSET: id, symbol, name, metadata.

DATASET: id, provider, symbol, kind, interval, currency.

FRAME: id, workspace_id, start, end, label.

VARIABLE: id, name, type, source, metadata.

OBSERVATION: variable_id, timestamp, value.

EVENT: id, timestamp, category, type, title, description, source, importance, scope, assets[], metadata.

EVENT SCOPE: `asset` para eventos próprios de um ativo; `market` para eventos compartilhados do mercado; `global` para eventos macro/global. Eventos compartilhados não são duplicados por ativo: uma única ocorrência pode referenciar vários ativos ou nenhum. Bitcoin Halving permanece como evento `protocol` específico de BTC.

RELATION: id, source_id, target_id, relation_type, lag, metadata.

EVENT CATEGORIES: `protocol`, `macro`, `regulatory`, `market`, `ecosystem`, `corporate`.

HYPOTHESIS: id, workspace_id, statement, status, created_at, updated_at.

TEST: id, hypothesis_id, external_system, external_id, version, status, result_reference.

## Princípio

Nem todas essas entidades precisam virar tabelas imediatamente. Primeiro definimos domínio e contratos; depois persistimos o necessário.

O modelo atual de D1 (datasets, candles, api_meta) continua como fundação de mercado. O modelo de investigação pode crescer separadamente.

## Integração

Cada produto externo deve ter identificação, versão, contrato de entrada, contrato de saída, referência ao Workspace, referência temporal e estado/status.
