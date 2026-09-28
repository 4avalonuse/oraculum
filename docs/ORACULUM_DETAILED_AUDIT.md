# ORACULUM — AUDITORIA ARQUITETURAL DETALHADA

Data: 2026-09-28
Repositório: 4avalonuse/oraculum
Branch: main
Referência: commit 1259f1c089af9170edc8e9cef0f6383f155ee175

## 1. OBJETIVO

Esta auditoria compara a visão definida para o Oraculum com o código que realmente existe hoje.

Regra adotada:
- não refatorar a fundação gráfica sem necessidade;
- não criar dezenas de abstrações vazias;
- separar domínio, aplicação, infraestrutura e apresentação;
- preservar a fundação herdada do Ochama;
- construir o Oraculum como ambiente de investigação, e não como um gráfico maior.

## 2. RESULTADO EXECUTIVO

### Estado geral

A fundação visual está suficientemente madura para deixar de ser o foco principal.

O maior trabalho agora não é gráfico. É arquitetural e de domínio.

Hoje o repositório é, na prática:

    Fundação gráfica do Ochama
             +
    documentação conceitual do Oraculum
             +
    esqueleto vazio de src/oraculum

A distância entre a visão e a implementação está concentrada na camada de investigação.

### Diagnóstico

| Área | Estado | Decisão |
|---|---|---|
| Chart | sólido | preservar |
| Viewport | sólido | preservar |
| Drawing | sólido | preservar |
| Interaction | funcional | preservar, refatorar depois |
| Studies | funcional | consolidar registry depois |
| Data OHLCV | funcional | preservar e generalizar |
| Storage | funcional, mas fragmentado | separar responsabilidades |
| Bootstrap | sobrecarregado | refatorar após domínio mínimo |
| Oraculum domain | praticamente inexistente | prioridade |
| Asset Panel | inexistente | criar |
| Timeline | inexistente | criar |
| Relations | inexistente | criar |
| Workspace | apenas conceito | criar núcleo |
| Frames | inexistente | criar junto do Workspace |
| Hypothesis | inexistente | criar depois do Workspace |
| Analytics | apenas placeholder | não expandir ainda |
| OAlgo | futuro | manter vazio |
| OBacktest | futuro | manter vazio |

Conclusão:

**Não devemos continuar adicionando indicadores agora.**
O próximo bloco de trabalho deve ser o núcleo real do Oraculum.

## 3. TREE REAL

A árvore atual foi conferida diretamente no GitHub.

Ela contém:

    src/
    ├── app/
    ├── chart/
    ├── data/
    ├── drawing/
    ├── indicators/
    ├── interaction/
    ├── oraculum/
    ├── storage/
    ├── studies/
    ├── styles/
    ├── ui/
    ├── utils/
    └── viewport/

Dentro de src/oraculum existem somente READMEs em:
- analytics
- events
- market
- oalgo
- obacktest
- variables
- workspace

Ou seja: a separação de diretórios existe, mas a separação de domínio ainda não existe em código.

## 4. AUDITORIA POR MÓDULO

### 4.1 app/

#### src/app/bootstrap.js

Responsabilidade atual:
- inicializar aplicação;
- buscar dados;
- normalizar candles;
- criar viewport;
- criar chart;
- criar drawing manager;
- criar drawing interaction;
- conectar menus;
- conectar estudos;
- conectar refresh;
- conectar seleção de ativo/provider/intervalo;
- persistir estado;
- controlar seleção de desenhos;
- controlar undo/redo/delete;
- manter estado de estudos.

Diagnóstico:
**sobrecarregado.**

O arquivo é o principal ponto de acoplamento atual.

Problemas:
1. conhece detalhes demais da UI;
2. conhece detalhes demais de estudos;
3. conhece desenhos;
4. conhece persistência;
5. conhece data loading;
6. conhece seleção de ativo/provider/interval;
7. possui definição duplicada dos estudos;
8. possui lógica de domínio potencial dentro do bootstrap;
9. ainda carrega nomenclatura Ochama.

Destino:
- manter temporariamente como composition root;
- depois reduzir para composição de módulos;
- não colocar lógica de Asset/Variable/Event/Relation/Workspace nele.

Prioridade:
**alta, mas somente depois do primeiro núcleo de domínio.**

### 4.2 chart/

#### src/chart/plot-geometry.js

Responsabilidade:
geometria do plot.

Diagnóstico:
**correto.**

Destino:
preservar.

#### src/chart/render.js

Responsabilidade:
renderização do gráfico, candles/linha, eixo, estudos, panes e desenhos.

Diagnóstico:
**bom para a fundação visual atual.**

Pontos positivos:
- renderer separado;
- usa viewport;
- usa drawing renderer;
- estudos são consultados pelo registry;
- normal/log passam pelo mesmo fluxo de renderização.

Ponto de atenção:
- render.js ainda conhece detalhes de studies e panes;
- getDrawingPlot repete parte do cálculo de geometria.

Isso é dívida técnica, não bloqueio.

Destino:
preservar agora; refatorar somente quando houver necessidade real.

### 4.3 data/

#### src/data/normalize.js

Responsabilidade:
raw -> candles normalizados, ordenação e validação.

Diagnóstico:
**base correta.**

Destino:
preservar.

Evolução futura:
a camada deve deixar de assumir que todo dado do Oraculum é candle.

Modelo futuro:

    data/
    ├── market
    ├── variables
    ├── events
    └── metadata

Mas sem destruir normalizeCandles.

#### src/data/client.js

Responsabilidade:
comunicação com API e carregamento de datasets.

Diagnóstico:
**adequado para a fundação atual.**

Problema:
está orientado quase totalmente a OHLCV.

Destino:
preservar como infraestrutura de aquisição; futuramente adicionar clients/adapters específicos sem misturar domínio.

#### src/data/cache.js

Responsabilidade:
cache local.

Diagnóstico:
**existe, mas não é uma camada plenamente integrada ao fluxo atual.**

Problema:
há diferença entre a existência do módulo e seu uso efetivo.

Destino:
ser explicitamente DATA CACHE, separado de:
- chart state;
- drawing state;
- workspace state.

Prioridade:
média.

### 4.4 storage/

#### src/storage/chart-state.js

Responsabilidade:
persistência do estado do gráfico/viewport.

Diagnóstico:
**correta e separada.**

Destino:
preservar.

Não deve virar storage genérico do Oraculum.

### 4.5 drawing/

A arquitetura de drawing é uma das partes mais fortes do projeto.

#### core/drawing-model.js

Responsabilidade:
documento de desenhos, versão e clonagem.

Diagnóstico:
**correto.**

Importante:
desenhos são armazenados em coordenadas de mercado.

Destino:
preservar.

#### core/drawing-registry.js

Responsabilidade:
registro de ferramentas.

Diagnóstico:
**bom padrão modular.**

Destino:
preservar e usar como referência para futuros registries.

#### core/drawing-manager.js

Responsabilidade:
estado, add/remove/replace, undo/redo.

Diagnóstico:
**correto.**

Destino:
preservar.

#### core/history.js

Responsabilidade:
histórico de estados.

Diagnóstico:
**correto.**

Destino:
preservar.

#### interaction/

Inclui:
- channel-interaction.js
- channel-state.js
- drawing-controller.js
- drawing-selection.js

Diagnóstico:
**funcional e modular o suficiente para a fundação atual.**

Destino:
preservar.

Problema futuro:
drawing-controller ainda concentra bastante interação, mas não deve ser quebrado prematuramente.

#### render/

Inclui:
- drawing-renderer.js
- geometry.js
- transform.js

Diagnóstico:
**boa separação.**

Destino:
preservar.

#### storage/drawing-persistence.js

Responsabilidade:
localStorage dos desenhos.

Diagnóstico:
**correto conceitualmente.**

Problemas:
- chave STORAGE_KEY ainda usa prefixo "ochama";
- warnings usam "[Ochama drawing]".

Isso é dívida de nomenclatura.

Destino:
migrar para namespace Oraculum quando houver uma mudança deliberada de storage versionado.

Não fazer rename isolado apenas por estética.

#### tools/

Inclui:
- line
- horizontal
- vertical
- rectangle
- reference
- channel
- ruler
- fibonacci
- text
- select
- index

Diagnóstico:
**bom.**

Destino:
preservar.

## 4.6 interaction/

#### src/interaction/manager.js

Responsabilidade:
gestos e navegação do viewport.

Diagnóstico:
**adequado para a fundação.**

Normal/log e gestos já funcionam sobre o mesmo viewport.

Destino:
preservar.

#### src/interaction/pointer.js

Responsabilidade:
adaptação da interação de ponteiro.

Diagnóstico:
**fina e apropriada.**

Destino:
preservar.

## 4.7 viewport/

Arquivos:
- bounds.js
- scale.js
- time-scale.js
- viewport.js
- y-viewport.js

Diagnóstico:
**fundação importante e adequada.**

A arquitetura temporal/vertical está suficientemente independente para ser reutilizada pelo Oraculum.

Destino:
preservar.

## 4.8 studies/

Arquivos:
- atr-study.js
- bollinger-study.js
- macd-study.js
- moving-average-study.js
- pane-study.js
- rsi-study.js
- volume-study.js
- study-registry.js
- index.js

Diagnóstico:
**funcional, mas com duplicação de fonte de verdade.**

Existe:
1. registry técnico;
2. objeto STUDIES no bootstrap;
3. lista manual no menu de ferramentas;
4. menus individuais.

Problema:
o sistema já possui o começo da arquitetura correta, mas ainda não a utiliza como fonte única.

Destino futuro:

    STUDY REGISTRY
          ↓
    metadata + defaults + renderer + placement
          ↓
       UI menus

Não refatorar agora. É uma etapa posterior de limpeza.

## 4.9 ui/

Os menus atuais são apresentação/configuração da fundação gráfica.

Diagnóstico:
**adequados para Ochama, não devem virar o núcleo do Oraculum.**

Particularmente:
- rsi-menu;
- volume-menu;
- macd-menu;
- bollinger-menu;
- atr-menu;
- moving-average-menu;
- fibonacci-menu.

Devem continuar sendo UI da camada visual.

O futuro Oraculum deverá ter UI própria para:
- asset panel;
- timeline;
- relations;
- workspace;
- frames;
- hypotheses.

Não colocar essas responsabilidades nesses menus.

## 4.10 styles/

Arquivos:
- app.css
- base.css
- chart.css
- layout.css

Diagnóstico:
funcional para a aplicação atual.

Ponto de atenção:
layout.css é relativamente grande e concentra bastante layout.

Destino:
não mexer agora.

Quando o shell do Oraculum nascer, separar:
- shell;
- panel;
- workspace;
- chart;
- shared primitives.

Sem criar dezenas de arquivos antes de existir UI.

## 4.11 indicators/

#### moving-average.js

Diagnóstico:
há uma possível sobreposição conceitual com studies/moving-average-study.js.

Isso merece investigação antes de qualquer limpeza.

Não apagar nem fundir automaticamente.

## 4.12 utils/

#### math.js

Diagnóstico:
pequeno e neutro.

Destino:
preservar.

## 5. src/oraculum — O PONTO CENTRAL DA AUDITORIA

Hoje existem apenas placeholders.

Isso significa:

    documentação: avançada
    arquitetura conceitual: avançada
    implementação de domínio: inicial

Essa é exatamente a lacuna que devemos fechar agora.

### 5.1 market/

Hoje: README.

Decisão:
não criar um grande módulo Market.

O mínimo necessário é um contrato de Asset.

Sugestão:

    src/oraculum/domain/asset/
        asset-model.js

Asset deve representar identidade e contexto do ativo, não preço inteiro.

### 5.2 variables/

Hoje: README.

Decisão:
criar Variable e Observation.

Separar:

    Variable = definição da série
    Observation = valor em um instante

### 5.3 events/

Hoje: README.

Decisão:
criar Event como entidade independente.

Não misturar com Variable.

### 5.4 analytics/

Hoje: README.

Decisão:
**não criar agora**:
- statistics/
- econometrics/
- deflation/
- correlation/
- lead-lag/
- event-study/

Primeiro criar contratos de Relation e Analysis.

Depois as capacidades entram como operações.

### 5.5 workspace/

Hoje: README.

Decisão:
é a próxima grande camada depois do núcleo semântico.

Workspace deve depender de objetos semânticos, não do canvas.

### 5.6 oalgo/

Hoje: README.

Decisão:
manter como futuro.

Não construir ainda.

### 5.7 obacktest/

Hoje: README.

Decisão:
manter como futuro.

Não construir ainda.

## 6. ARQUITETURA FINAL RECOMENDADA

A tree planejada originalmente deve ser ajustada.

Em vez de:

    oraculum/
      market/
      variables/
      events/
      analytics/
      workspace/

recomenda-se:

    src/
    ├── app/
    ├── oraculum/
    │   ├── domain/
    │   │   ├── asset/
    │   │   ├── variable/
    │   │   ├── observation/
    │   │   ├── event/
    │   │   ├── relation/
    │   │   ├── timeline/
    │   │   ├── frame/
    │   │   ├── workspace/
    │   │   └── hypothesis/
    │   │
    │   ├── application/
    │   │   ├── asset-panel/
    │   │   ├── investigation/
    │   │   ├── workspace/
    │   │   └── analysis/
    │   │
    │   ├── analytics/
    │   │   └── capabilities/
    │   │
    │   ├── oalgo/
    │   └── obacktest/
    │
    ├── chart/
    ├── drawing/
    ├── interaction/
    ├── viewport/
    ├── studies/
    ├── data/
    ├── storage/
    ├── ui/
    └── styles/

### Por que essa mudança?

Porque:
- Asset, Event, Relation etc. são conceitos;
- Asset Panel, Investigation e Workspace orchestration são casos de uso;
- correlation/lead-lag são capacidades analíticas;
- chart/drawing/viewport continuam infraestrutura visual.

Isso reduz acoplamento.

## 7. FLUXO DE DEPENDÊNCIA

A regra deve ser:

    UI
      ↓
    Application
      ↓
    Domain

    Infrastructure
      ↓
    Application / adapters

E:

    Chart/Drawing/Viewport
      ↑
    adapters/application

O domínio não deve importar:
- DOM;
- canvas;
- document;
- window;
- renderer.

## 8. CONTRATOS MÍNIMOS A CRIAR

### Asset

    {
      id,
      symbol,
      name,
      type,
      currency,
      country,
      metadata
    }

### Variable

    {
      id,
      name,
      category,
      subcategory,
      symbol,
      source,
      unit,
      frequency,
      description
    }

### Observation

    {
      variableId,
      timestamp,
      value,
      revision,
      source
    }

### Event

    {
      id,
      timestamp,
      category,
      type,
      country,
      title,
      description,
      source,
      importance
    }

### Relation

    {
      id,
      source,
      target,
      type,
      method,
      lag,
      window,
      period,
      result,
      limitations
    }

### Frame

    {
      id,
      type,
      source,
      timeRange,
      position,
      size,
      configuration
    }

### Workspace

    {
      id,
      name,
      timeRange,
      objects,
      frames,
      relations,
      annotations,
      hypotheses,
      metadata
    }

### Hypothesis

    {
      id,
      statement,
      evidence,
      period,
      relations,
      tests,
      status
    }

Esses contratos são deliberadamente pequenos.

## 9. STORAGE — SEPARAÇÃO NECESSÁRIA

Hoje existem pelo menos três estados diferentes:

    DATA CACHE
    CHART STATE
    DRAWING STATE

O Oraculum adicionará:

    WORKSPACE STATE

E posteriormente:

    INVESTIGATION STATE
    FRAMEWORK STATE

Nunca usar um único storage genérico para tudo.

## 10. NOMENCLATURA

A cópia do Ochama deixou rastros legítimos, mas eles devem ser tratados de forma controlada.

Encontrados:
- package name "ochama";
- title "Ochama";
- branding OChamã;
- window.ochama;
- query strings de cache;
- STORAGE_KEY "ochama:drawing-documents:v1";
- logs "[Ochama ...]".

Decisão:
não fazer uma limpeza cosmética agora.

Primeiro criar o shell Oraculum.

Depois migrar nomenclatura em uma mudança única e consciente.

Importante:
**não adicionar novos ?v=... para forçar cache.**

## 11. STUDIES — DECISÃO

Não adicionar indicadores agora.

A fundação já possui:
- RSI;
- Volume;
- MACD;
- Bollinger;
- ATR;
- Moving Average.

O próximo ganho arquitetural virá de:

    Asset
    Variable
    Event
    Relation
    Timeline
    Workspace

e não de outro indicador.

## 12. AUDITORIA DE TESTABILIDADE

O domínio futuro deve poder ser testado sem browser.

Exemplos:

    createAsset()
    createVariable()
    createObservation()
    createEvent()
    createRelation()
    createFrame()
    createWorkspace()
    addObjectToWorkspace()
    alignFrames()
    createHypothesis()

Esses testes não devem depender de:
- canvas;
- DOM;
- window;
- ResizeObserver.

A fundação gráfica continua com seus testes próprios.

## 13. RISCOS CONFIRMADOS

### R1 — Bootstrap monolítico
Se continuarmos adicionando recursos diretamente nele, a arquitetura degrada.

### R2 — Oraculum virar Ochama+
O risco é real se o próximo passo for outro indicador ou ferramenta gráfica.

### R3 — Analytics prematuro
Criar pastas de econometria antes de haver Relation/Analysis cria estrutura vazia.

### R4 — Workspace acoplado ao canvas
Deve ser evitado desde o primeiro commit do Workspace.

### R5 — Storage misturado
Data, chart, drawing e workspace precisam de fronteiras próprias.

### R6 — Registry duplicado
Studies já demonstram o problema; futuras entidades devem ter fonte única.

### R7 — Domínio depender de UI
Proibido.

## 14. O QUE FICA

Fica como fundação:

- chart;
- plot geometry;
- render;
- viewport;
- interaction;
- drawing;
- studies;
- data OHLCV;
- chart state;
- drawing persistence;
- UI gráfica atual.

## 15. O QUE SERÁ EVOLUÍDO

Evolução posterior:

- bootstrap;
- study registry/UI;
- cache;
- nomenclatura;
- storage orchestration;
- layout shell.

## 16. O QUE SERÁ CRIADO

Primeiro:

    domain/
      asset
      variable
      observation
      event
      relation
      timeline
      frame
      workspace

Depois:

    application/
      asset-panel
      investigation
      workspace
      analysis

Depois:

    analytics/capabilities

Depois:

    hypothesis

Depois:

    framework

E somente depois:

    oalgo
    obacktest

## 17. ORDEM DE IMPLEMENTAÇÃO APÓS A AUDITORIA

### BLOCO A — domínio mínimo

1. Asset
2. Variable
3. Observation
4. Event
5. Relation

### BLOCO B — tempo

6. Timeline

### BLOCO C — composição

7. Frame
8. Workspace
9. Alignment

### BLOCO D — entrada do produto

10. Asset Panel
11. Investigation state

### BLOCO E — análise

12. Analysis contract
13. correlation
14. lead/lag
15. event study
16. transformations

### BLOCO F — raciocínio

17. Hypothesis
18. Test
19. Framework

### BLOCO G — automação

20. OAlgo
21. OBacktest

## 18. PRIMEIRO CASO REAL

Não devemos construir todos os conceitos ao mesmo tempo.

O primeiro vertical slice recomendado é:

    BTC
     ↓
    Asset
     ↓
    Asset Panel
     ↓
    preço atual
     ↓
    gráfico Ochama
     ↓
    eventos
     ↓
    timeline
     ↓
    enviar para Workspace

Esse fluxo provará a arquitetura inteira sem exigir econometria ainda.

## 19. CRITÉRIO DE ACEITE DO PRIMEIRO SLICE

O primeiro slice estará correto quando:

- o usuário escolhe BTC;
- o sistema cria/usa um Asset sem depender do canvas;
- o painel conhece o Asset;
- o gráfico continua funcionando;
- eventos podem ser associados ao Asset;
- a Timeline consegue receber objetos temporais;
- um Frame pode representar o gráfico;
- o Frame pode entrar no Workspace;
- o Workspace pode ser salvo;
- nenhuma dessas entidades depende diretamente de render.js.

## 20. TESTES MÍNIMOS

Antes do primeiro slice:

- Asset model;
- Variable model;
- Observation model;
- Event model;
- Relation model.

Depois:

- Timeline;
- Frame;
- Workspace;
- persistence.

Depois:

- integração Asset Panel -> chart.

## 21. DECISÃO FINAL DA AUDITORIA

A fundação não deve ser reescrita.

O projeto deve mudar de fase.

Até aqui, o trabalho foi principalmente:

    construir uma boa fundação gráfica.

A partir daqui, o trabalho deve ser:

    construir o cérebro semântico do Oraculum.

A arquitetura recomendada é:

    ORACULUM
       │
       ├── DOMAIN
       │    ├── Asset
       │    ├── Variable
       │    ├── Observation
       │    ├── Event
       │    ├── Relation
       │    ├── Timeline
       │    ├── Frame
       │    ├── Workspace
       │    └── Hypothesis
       │
       ├── APPLICATION
       │    ├── Asset Panel
       │    ├── Investigation
       │    ├── Workspace
       │    └── Analysis
       │
       ├── ANALYTICS
       │
       ├── OALGO
       └── OBACKTEST

       +
       │
       ▼

    OCHAMA FOUNDATION
       ├── Chart
       ├── Drawing
       ├── Interaction
       ├── Viewport
       └── Studies

       +
       │
       ▼

    DATA / STORAGE / INFRASTRUCTURE

## 22. STATUS

Auditoria arquitetural: **CONCLUÍDA**

Refactor estrutural: **NÃO INICIADO**

Próxima implementação: **BLOCO A — domínio mínimo**

Nenhum teste remoto foi declarado como executado nesta auditoria; o diagnóstico foi feito pela inspeção da árvore e dos arquivos atuais do repositório.

## 23. REGRA DE OURO

> Se uma mudança deixa o gráfico mais sofisticado, mas não aumenta a capacidade do Oraculum de investigar, relacionar, organizar ou testar informação, ela não é prioridade neste momento.
