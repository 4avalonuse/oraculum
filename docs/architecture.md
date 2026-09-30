# ORACULUM — Arquitetura

## 1. Papel do ORACULUM

ORACULUM é o ambiente central de investigação.

Ele não precisa executar tudo. Ele precisa **organizar, relacionar, visualizar e preservar** o trabalho de investigação.

### O que pertence ao ORACULUM

- Workspace
- navegação
- contexto do ativo
- seleção e descoberta de datasets
- composição de visualizações
- timeline
- eventos
- variáveis
- relações
- anotações
- hipóteses
- persistência da investigação
- contratos de integração
- histórico/versionamento do trabalho

### O que não pertence ao ORACULUM

- implementação interna do Ochama
- criação interna de algoritmos do OAlgo
- motor interno do OBacktest
- execução de ordens do OWin

Esses sistemas podem ser chamados, incorporados visualmente ou receber/enviar dados, mas continuam independentes.

## 2. Produtos conectados

### Ochama

Responsabilidade: visualizar e explorar dados de mercado.

Entrada típica:
- dataset
- intervalo
- janela temporal
- estudos/estado visual

Saída típica:
- seleção temporal
- seleção de preço
- desenho/anotação
- estado visual
- contexto para investigação

O ORACULUM não copia o código do Ochama. Ele conversa com ele por contrato.

### OAlgo

Responsabilidade: transformar uma hipótese em lógica formal.

Exemplo conceitual:

RSI < 30 AND PRICE > EMA20 → BUY

O ORACULUM fornece contexto e pode enviar a hipótese para o OAlgo. O resultado retorna como artefato/versionamento.

### OBacktest

Responsabilidade: testar uma lógica sobre dados históricos.

Recebe:
- estratégia/versão
- dataset
- período
- parâmetros

Devolve resultados e metadados para o Workspace.

### OWin

Responsabilidade: operação/execução.

Recebe uma estratégia aprovada e um contexto operacional compatível. O ORACULUM acompanha o estado e registra resultados, sem absorver o motor de execução.

## 3. Modelo conceitual

As entidades centrais são:

- **ASSET** — BTC, ETH, SOL etc.
- **DATASET** — uma fonte/mercado/intervalo específico.
- **VARIABLE** — preço, volume, indicador, variável econômica etc.
- **OBSERVATION** — valor de uma variável em determinado instante.
- **EVENT** — notícia, decisão, anúncio, dado econômico ou outro acontecimento temporal.
- **RELATION** — correlação, dependência, precedência, lead/lag ou relação definida pelo usuário.
- **TIMELINE** — eixo temporal compartilhado.
- **FRAME** — recorte temporal/contextual de investigação.
- **HYPOTHESIS** — afirmação investigável.
- **TEST** — experimento associado a uma hipótese.
- **WORKSPACE** — contêiner persistente da investigação.

O gráfico é uma visualização de entidades e observações; não é a entidade central do sistema.

## 4. Workspace

O Workspace deve permitir:

- abrir vários ativos;
- combinar séries;
- alinhar períodos;
- comparar janelas;
- sobrepor ou empilhar visualizações;
- criar recortes;
- marcar eventos;
- medir distâncias;
- registrar hipóteses;
- relacionar variáveis;
- salvar o estado;
- duplicar uma investigação;
- voltar a versões anteriores.

A liberdade visual existe, mas o tempo continua sendo uma estrutura fundamental. Elementos precisam poder responder: **o que é, a que período pertence e com o que está relacionado?**

## 5. Investigação quantitativa e qualitativa

ORACULUM deve aceitar os dois lados.

### Quantitativo

- retornos;
- volatilidade;
- médias;
- correlações;
- regressões;
- distribuições;
- transformações;
- normalização/deflação;
- estatística;
- econometria;
- lead/lag;
- testes.

### Qualitativo/eventos

- notícias;
- decisões;
- anúncios;
- eventos macroeconômicos;
- acontecimentos específicos de um ativo;
- classificação de impacto;
- observações humanas.

O sistema não assume antecipadamente qual modelo estatístico ou causal será correto.

## 6. Relações

Uma relação deve poder ser explícita e editável.

Exemplos conceituais:

BTC → NASDAQ

FED RATE → BTC

EVENT → PRICE

VARIABLE A --lead 7d--> VARIABLE B

Isso permite investigar relações sem confundir correlação com causalidade.

## 7. Camadas técnicas

A implementação deve manter limites claros:

- data/ — contratos e acesso a dados
- logic/ — domínio e regras
- render/ — renderização
- ui/ — controles e interação
- storage/ — persistência local/servidor
- api/ — comunicação externa
- workspace/ — composição da investigação
- integrations/ — contratos com Ochama/OAlgo/OBacktest/OWin

app.js apenas inicializa e conecta módulos.

## 8. Regra de evolução

Não reconstruir tudo de uma vez.

Ordem inicial:

1. Shell e navegação.
2. Workspace vazio, persistente e editável.
3. Catálogo de datasets.
4. Primeiro painel visual conectado ao Ochama.
5. Timeline e eventos.
6. Variáveis e relações.
7. Hipóteses.
8. Integrações com OAlgo/OBacktest/OWin.

Cada etapa deve funcionar antes da próxima.
