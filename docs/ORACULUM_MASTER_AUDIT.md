# ORACULUM — DOCUMENTAÇÃO MESTRA PARA AUDITORIA E PLANEJAMENTO

> Documento-base consolidado da visão, conceitos, navegação, Workspace, arquitetura, tree e roadmap do Oraculum.
>
> Repositório: 4avalonuse/oraculum — branch main.

---

# 1. VISÃO DO SISTEMA

## 1.1 Propósito

Oraculum é concebido como um ambiente de investigação de mercado, não apenas como uma plataforma de gráficos.

O objetivo é permitir que o usuário escolha um ativo, compreenda seu contexto, observe o passado e o futuro conhecido, investigue relações entre variáveis e eventos, construa mapas temporais e formule hipóteses que possam ser testadas.

O gráfico é uma ferramenta dentro do sistema, não necessariamente a porta de entrada.

## 1.2 Princípio central

**Ochama responde principalmente: “olhe para o mercado”.**

**Oraculum deve responder: “investigue o que está acontecendo no mercado”.**

## 1.3 Fluxo mental

```
OBSERVAR
   ↓
COMPARAR
   ↓
RELACIONAR
   ↓
FORMULAR HIPÓTESE
   ↓
TESTAR
   ↓
ALGO
```

O sistema deve acompanhar esse fluxo sem obrigar o usuário a seguir uma sequência rígida.

## 1.4 Experiência desejada

Entrada conceitual:

1. escolher um ativo;
2. abrir o painel desse ativo;
3. visualizar resumo, contexto, eventos próximos, histórico e relações;
4. abrir gráficos, estudos, vídeos, dados e análises quando necessário;
5. investigar relações antecipadas e atrasadas;
6. abrir ou criar um Workspace;
7. colocar ativos, índices, variáveis, eventos, ciclos e outros objetos em um mapa;
8. alinhar Frames no tempo;
9. desenhar, comparar e analisar;
10. registrar hipóteses;
11. testar;
12. eventualmente transformar uma hipótese em algo executável pelo OAlgo/OBACKTEST.

## 1.5 O que Oraculum não deve ser

- Não deve ser apenas um gráfico com muitos indicadores.
- Não deve hardcodar indicadores macro específicos na lógica principal.
- Não deve transformar cada recurso em uma tela isolada.
- Não deve misturar aquisição de dados, análise, renderização e UI.
- Não deve assumir causalidade apenas porque existe correlação.
- Não deve antecipar abstrações desnecessárias antes de existirem casos reais.

## 1.6 Princípios

- modularidade;
- investigação orientada a objetos;
- tempo como eixo comum;
- dados quantitativos e contexto qualitativo juntos, mas semanticamente separados;
- evidência rastreável;
- hipóteses testáveis;
- visualização como instrumento;
- Workspace como ambiente de pensamento;
- compatibilidade com a fundação gráfica herdada do Ochama.

---

# 2. MODELO MENTAL DO PRODUTO

A ideia central é que o usuário não entra no Oraculum para simplesmente abrir um gráfico.

Ele entra para **investigar um ativo, uma relação, um evento ou uma hipótese**.

Uma investigação pode começar assim:

```
ORACULUM
   ↓
ESCOLHER ATIVO
   ↓
PAINEL DO ATIVO
   ↓
CONTEXTO + TIMELINE + RELAÇÕES
   ↓
WORKSPACE
   ↓
FRAMES
   ↓
ANÁLISE
   ↓
HIPÓTESE
   ↓
TESTE
```

Mas também pode começar diretamente por:

- um evento;
- uma variável;
- uma relação;
- um Workspace;
- uma hipótese;
- uma investigação salva.

A navegação deve ser não linear.

---

# 3. CONCEITOS FUNDAMENTAIS

## 3.1 ATIVO

Objeto de mercado que pode ser investigado: BTC, SOL, índice, ação, moeda, commodity etc.

Um ativo pode possuir:

- preço;
- volume;
- estudos;
- eventos relacionados;
- variáveis contextuais;
- relações;
- histórico;
- Workspaces;
- Frameworks.

---

## 3.2 VARIABLE

Medida ou série temporal observável.

Exemplos conceituais:

- inflação;
- juros;
- liquidez;
- DXY;
- emprego;
- yield;
- fluxo.

Contrato conceitual:

```
VARIABLE
├── id
├── name
├── category
├── subcategory
├── symbol
├── country
├── source
├── unit
├── frequency
└── description
```

Não hardcodar CPI, GDP, FOMC ou outros casos individuais como estruturas diferentes.

---

## 3.3 OBSERVATION

Valor de uma VARIABLE em determinado instante.

```
OBSERVATION
├── variable_id
├── timestamp
├── value
├── revision
└── source
```

---

## 3.4 EVENT

Ocorrência datada que possui significado contextual.

Exemplos:

- divulgação econômica;
- decisão monetária;
- anúncio regulatório;
- evento geopolítico;
- evento corporativo;
- eleição;
- sanção;
- mudança de política.

Contrato conceitual:

```
EVENT
├── id
├── timestamp
├── category
├── type
├── country
├── title
├── description
├── source
└── importance
```

**EVENT não deve ser confundido com VARIABLE.**

Uma variável é uma série/medida.

Um evento é uma ocorrência.

---

## 3.5 RELATION

Representação de uma relação investigável entre objetos ou séries.

Pode carregar:

- objeto A;
- objeto B;
- método;
- janela;
- defasagem;
- resultado;
- período;
- fonte;
- limitações.

Possibilidades:

- correlação;
- correlação defasada;
- lead/lag;
- regressão;
- dependência temporal;
- event study.

**Correlação não implica causalidade.**

---

## 3.6 LEAD/LAG

Investigação de deslocamento temporal entre séries ou eventos.

O sistema deve distinguir:

- A antecede B;
- B antecede A;
- relação contemporânea;
- relação não detectada.

Isso é análise estatística, não promessa de previsão.

O Oraculum pode mostrar que determinada variável historicamente apresenta relação anterior a outra, mas deve preservar:

- período;
- janela;
- método;
- amostra;
- limitações;
- estabilidade da relação.

---

## 3.7 TIMELINE

Eixo temporal que organiza:

- observações;
- eventos;
- fatos;
- ciclos;
- mudanças relevantes;
- marcos;
- eventos futuros conhecidos/agendados.

Deve permitir navegar pelo passado, presente e futuro conhecido.

---

## 3.8 FRAME

Unidade visual/analítica que pode ser colocada no Workspace e alinhada temporalmente.

Um Frame pode representar:

- gráfico;
- série;
- evento;
- ciclo;
- índice;
- estudo;
- análise;
- composição de elementos.

Exemplos:

```
FRAME — BTC PRICE
FRAME — DXY
FRAME — LIQUIDITY
FRAME — FOMC EVENTS
FRAME — VOLATILITY
FRAME — ETF FLOWS
FRAME — CORRELATION
```

---

## 3.9 WORKSPACE

Ambiente de investigação editável.

O usuário pode colocar:

- ativos;
- gráficos;
- índices;
- variáveis;
- eventos;
- ciclos;
- estudos;
- notícias/contextos;
- Frames;
- análises;
- desenhos;
- hipóteses.

O Workspace não é apenas um canvas livre.

Ele possui:

- contexto temporal;
- objetos semânticos;
- alinhamento;
- camadas;
- persistência;
- relações.

---

## 3.10 HYPOTHESIS

Proposição investigável criada pelo usuário.

Uma hipótese deve poder apontar para:

- evidências;
- relações;
- períodos;
- eventos;
- dados;
- testes.

Exemplo conceitual:

> “Mudanças de liquidez antecedem movimentos do BTC em determinadas condições.”

Isso deve virar algo testável, e não apenas uma anotação textual.

---

## 3.11 TEST

Procedimento que verifica uma hipótese ou propriedade observada.

O resultado deve preservar:

- método;
- período;
- dados utilizados;
- parâmetros;
- resultado;
- limitações.

---

## 3.12 FRAMEWORK

Conjunto reutilizável de:

- objetos;
- relações;
- análises;
- Frames;
- hipóteses;
- filtros;
- configurações.

Deve ser editável e persistível.

Exemplo:

```
FRAMEWORK
BTC MACRO

├── BTC
├── DXY
├── Liquidez
├── Juros
├── Nasdaq
├── Eventos FOMC
├── Correlação
├── Lead/Lag
└── Hipóteses
```

---

## 3.13 OALGO

Camada futura que transforma lógica investigada em algoritmo estruturado.

---

## 3.14 OBACKTEST

Camada futura que testa algoritmos e hipóteses sobre histórico.

---

## 3.15 OCHAMA

Fundação de visualização herdada e preservada dentro do Oraculum:

- gráfico;
- viewport;
- estudos;
- desenhos;
- interação;
- renderização;
- escalas;
- ferramentas gráficas.

O Oraculum deve reutilizar essa fundação em vez de duplicá-la.

---

# 4. PAINEL DO ATIVO

O Painel do Ativo é o principal hub de investigação.

Exemplo conceitual:

```
BTC
Bitcoin

PREÇO
$xxx,xxx

MOMENTO
────────────────
tendência
volatilidade
volume
fluxos
liquidez

PRÓXIMOS EVENTOS
────────────────
• FOMC
• CPI
• vencimentos
• decisões regulatórias
• outros eventos relevantes

LINHA DO TEMPO
────────────────
← passado ───────────── agora ───── futuro →

     fato       evento       crise       evento

RELAÇÕES
────────────────
DXY        → BTC
Liquidez   → BTC
Juros      → BTC
Nasdaq     → BTC

SINAIS ANTECIPADOS
────────────────
variável A ──► BTC
variável B ───► BTC

RELAÇÕES ATRASADAS
────────────────
BTC ──► variável X
BTC ───► variável Y
```

O painel pode abrir:

- gráficos;
- estudos;
- dados;
- análises;
- eventos;
- notícias;
- vídeos;
- relações;
- histórico;
- Workspace.

Esses elementos devem alimentar a investigação.

---

# 5. NAVEGAÇÃO

## 5.1 Entrada

A entrada principal não deve obrigatoriamente abrir um gráfico.

A pergunta inicial pode ser:

**“O que você quer investigar?”**

Possíveis entradas:

- Explorar;
- Comparar;
- Investigar relações;
- Eventos;
- Analisar;
- Testar hipótese;
- escolher um ativo;
- abrir Workspace.

---

## 5.2 Painel

O ativo selecionado vira o centro contextual.

O usuário consegue navegar de:

```
ATIVO
 ↓
EVENTO
 ↓
RELAÇÃO
 ↓
WORKSPACE
 ↓
ANÁLISE
 ↓
HIPÓTESE
```

e voltar sem perder o contexto.

---

## 5.3 Navegação não linear

O usuário deve poder:

- voltar de uma análise para os dados;
- abrir um evento a partir do gráfico;
- abrir o ativo a partir de uma variável;
- enviar uma relação para o Workspace;
- enviar um gráfico para um Frame;
- enviar uma hipótese para um teste.

---

# 6. TIMELINE

A Timeline é uma das estruturas centrais do Oraculum.

Ela deve organizar temporalmente:

```
MERCADO
EVENTOS
VARIÁVEIS
CICLOS
NOTÍCIAS
FATOS
ESTUDOS
ANÁLISES
```

Exemplo:

```
TEMPO ───────────────────────────────────────────────►

BTC
──────╱╲──────╱╲──────────────╲──────╱─────────────

DXY
────╲────────╱──────╲────────────╱─────────────────

LIQUIDEZ
──────────────╱────────────╱──────────────╲────────

CPI
              │                 │
              ●                 ●

FOMC
                        │
                        ●

EVENTOS
───────●───────────────●──────────────●────────────
```

O tempo deve ser a referência comum.

---

# 7. RELAÇÕES

O Oraculum deve permitir investigar:

## Relações contemporâneas

```
BTC ↔ DXY
```

## Relações antecipadas

```
LIQUIDEZ ─────► BTC
```

## Relações atrasadas

```
BTC ─────► OUTRA VARIÁVEL
```

## Eventos

```
EVENTO
   ↓
MOVIMENTO
   ↓
IMPACTO
```

## Métodos futuros

- correlação;
- correlação móvel;
- correlação defasada;
- regressão;
- transformação;
- normalização;
- deflação;
- lead/lag;
- event study;
- análise de janela;
- comparação entre ativos.

---

# 8. WORKSPACE

O Workspace é o **laboratório do Oraculum**.

É onde o usuário transforma informação em investigação.

## 8.1 Objetos

```
Asset
Variable
Observation
Event
Cycle
Index
Chart
Study
Relation
Frame
Analysis
Hypothesis
Annotation
```

## 8.2 Mapa

O usuário pode posicionar objetos espacialmente.

Exemplo:

```
┌─────────────────────────────────────────────┐
│                 WORKSPACE                   │
│                                             │
│  BTC PRICE                                  │
│  ═══════════════════════════════════        │
│                                             │
│        DXY                                  │
│  ────────────────────────────────           │
│                                             │
│              LIQUIDITY                      │
│  ────────────────────────────────           │
│                                             │
│                    FOMC                     │
│                       │                     │
│                       ▼                     │
│  ──────────────── EVENTO ───────────────    │
│                                             │
│       CPI                                  │
│  ────────────────────────────────           │
│                                             │
└─────────────────────────────────────────────┘
```

O posicionamento espacial ajuda o raciocínio, mas não altera os dados originais.

---

# 9. FRAMES

A ideia de Frame é central para a próxima camada.

Um Frame é um bloco de informação visual/analítica que pode ser organizado e alinhado.

Exemplo:

```
FRAME 1 — BTC
FRAME 2 — DXY
FRAME 3 — LIQUIDEZ
FRAME 4 — JUROS
FRAME 5 — EVENTOS
FRAME 6 — VOLATILIDADE
```

Depois:

```
TEMPO ──────────────────────────────────────────────►

BTC
════════════════════════════════════════════════════

DXY
────────────────────────────────────────────────────

LIQUIDEZ
────────────────────────────────────────────────────

JUROS
────────────────────────────────────────────────────

EVENTOS
────●────────────●────────────────●────────────────
```

A camada de alinhamento permite comparar acontecimentos no mesmo instante ou em diferentes defasagens.

---

# 10. CAMADAS DO WORKSPACE

Separação conceitual:

1. dados;
2. visualização;
3. eventos/contexto;
4. análises;
5. desenhos/anotações;
6. interação.

Um desenho não deve alterar a série.

Uma análise não deve depender diretamente do canvas.

O renderer não deve conhecer a lógica econômica.

---

# 11. PERSISTÊNCIA

Um Workspace deve poder ser salvo e reaberto com:

- objetos;
- posições;
- Frames;
- filtros;
- relações;
- desenhos;
- anotações;
- estado temporal;
- hipóteses.

No futuro, um Workspace poderá virar um Framework reutilizável.

---

# 12. ARQUITETURA

A arquitetura planejada é:

```
ORACULUM
│
├── MARKET
├── VARIABLES
├── EVENTS
├── TIMELINE
├── RELATIONS
├── ASSET-PANEL
├── WORKSPACE
│   ├── OBJECTS
│   ├── FRAMES
│   ├── ALIGNMENT
│   ├── LAYERS
│   └── PERSISTENCE
├── ANALYTICS
├── HYPOTHESES
├── OALGO
└── OBACKTEST
```

E a fundação visual/técnica:

```
OCHAMA FOUNDATION
│
├── chart
├── drawing
├── interaction
├── viewport
├── studies
├── data
├── storage
├── ui
└── styles
```

---

# 13. TREE PLANEJADA

```
src/
├── app/
│
├── oraculum/
│   ├── market/
│   ├── variables/
│   ├── events/
│   ├── timeline/
│   ├── relations/
│   ├── asset-panel/
│   ├── workspace/
│   │   ├── objects/
│   │   ├── frames/
│   │   ├── alignment/
│   │   ├── layers/
│   │   └── persistence/
│   ├── analytics/
│   │   ├── statistics/
│   │   ├── econometrics/
│   │   ├── transformations/
│   │   ├── deflation/
│   │   ├── correlation/
│   │   ├── lead-lag/
│   │   └── event-study/
│   ├── hypotheses/
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
```

## Regra

`oraculum/` contém domínio e lógica específica do produto.

`chart/`, `drawing/`, `interaction/`, `viewport/`, `studies/` e os demais módulos herdados continuam sendo a fundação visual/técnica.

Não duplicar lógica de gráfico dentro de `oraculum/`.

---

# 14. TREE ATUAL VS TREE DESEJADA

## Atual

A tree atual já possui:

```
oraculum/
├── market/
├── variables/
├── events/
├── workspace/
├── analytics/
├── oalgo/
└── obacktest/
```

Isso foi uma boa primeira decomposição.

## Ausências conceituais

Ainda não existem como módulos próprios:

- Asset Panel;
- Timeline;
- Relations;
- Frames;
- temporal alignment;
- Hypotheses;
- Frameworks.

Isso não significa que todas as pastas devam ser criadas imediatamente.

Primeiro devem existir contratos e casos reais.

---

# 15. AUDITORIA DA FUNDAÇÃO ATUAL

## Já adequado

- separação da fundação gráfica;
- existência de domínio Oraculum separado;
- market/variables/events/workspace/analytics/oalgo/obacktest como primeira decomposição;
- documentação arquitetural;
- testes existentes para partes da fundação;
- gráfico, viewport, estudos, desenhos e interação preservados.

## Ainda incompleto

A implementação atual ainda é essencialmente a fundação gráfica do Ochama com o primeiro esqueleto de domínio Oraculum.

A camada de investigação ainda precisa ser construída.

## Principais riscos

### 1. Virar “Ochama com mais indicadores”

Esse é o maior risco.

O Oraculum deve adicionar investigação, contexto, relações e hipóteses — não simplesmente mais ferramentas gráficas.

### 2. Bootstrap virar centro de tudo

A lógica de domínio não deve ser colocada no bootstrap/UI.

### 3. Misturar Event e Variable

Devem continuar semanticamente distintos.

### 4. Confundir correlação com causalidade

Toda análise precisa preservar método, período e limitações.

### 5. Criar abstração demais

Não criar dezenas de classes/pastas antes do primeiro caso real exigir.

### 6. Acoplar Workspace ao renderer

Workspace deve trabalhar com objetos e estado sem depender diretamente do canvas.

### 7. Duplicar lógica

Um conceito deve ter um dono claro.

---

# 16. CRITÉRIO PARA NOVAS DECISÕES ARQUITETURAIS

Toda mudança estrutural deve responder:

1. Qual conceito ela representa?
2. Quem é dono desse conceito?
3. Quais dados entram?
4. Quais dados saem?
5. Quem pode depender dele?
6. É domínio, infraestrutura ou apresentação?
7. Pode ser testado sem o canvas?
8. Está duplicando alguma responsabilidade?
9. Existe um caso real que justifique a abstração?
10. Isso aproxima o sistema do Oraculum ou apenas aumenta o Ochama?

---

# 17. ROADMAP

## FASE 0 — ARQUITETURA

- documentar visão;
- fechar conceitos;
- definir navegação;
- definir Workspace;
- definir contratos;
- auditar tree atual.

**Estado:** documentação inicial criada. Próximo passo: auditoria detalhada.

## FASE 1 — SHELL DO ORACULUM

Criar a experiência de entrada sem substituir o gráfico.

Objetivo:

- seleção de ativo;
- navegação inicial;
- estrutura de aplicação.

## FASE 2 — PAINEL DO ATIVO

Implementar painel real para um ativo.

Primeiro caso pode usar os dados já disponíveis.

## FASE 3 — TIMELINE

Criar linha do tempo com:

- eventos;
- fatos;
- observações;
- marcos.

## FASE 4 — VARIÁVEIS E CONTEXTO

Implementar:

```
VARIABLE
OBSERVATION
EVENT
```

com contratos genéricos.

## FASE 5 — RELAÇÕES

Criar infraestrutura para:

- correlação;
- lead/lag;
- transformações;
- regressões;
- event studies.

## FASE 6 — WORKSPACE

Criar Workspace editável.

Adicionar:

- objetos;
- Frames;
- mapa;
- persistência.

## FASE 7 — ALINHAMENTO TEMPORAL

Permitir vários Frames alinhados na mesma referência temporal.

## FASE 8 — ANOTAÇÕES E EVIDÊNCIA

Adicionar:

- desenhos;
- marcadores;
- notas;
- vínculos entre evidência e hipótese.

## FASE 9 — HIPÓTESES E TESTES

Criar objetos de hipótese e resultados reproduzíveis.

## FASE 10 — FRAMEWORKS

Permitir salvar investigações completas como Frameworks editáveis.

## FASE 11 — OALGO

Transformar hipóteses/regras estruturadas em algoritmos.

## FASE 12 — OBACKTEST

Testar algoritmos e hipóteses em histórico.

---

# 18. ORDEM DE CONSTRUÇÃO

A ordem não deve ser simplesmente:

```
gráfico → indicador → indicador → indicador
```

Deve ser:

```
ENTRADA
 ↓
ATIVO
 ↓
PAINEL
 ↓
CONTEXTO
 ↓
TIMELINE
 ↓
RELAÇÕES
 ↓
WORKSPACE
 ↓
FRAMES
 ↓
ALINHAMENTO
 ↓
HIPÓTESE
 ↓
TESTE
 ↓
OALGO
 ↓
OBACKTEST
```

O gráfico existe desde o começo como instrumento.

Mas ele deixa de ser o centro absoluto do produto.

---

# 19. RELAÇÃO ENTRE ORACULUM E OCHAMA

```
                    ORACULUM
                       │
          ┌────────────┴────────────┐
          │                         │
    INVESTIGAÇÃO              VISUALIZAÇÃO
          │                         │
   contexto / relações             │
   hipóteses / testes              ▼
   timeline / workspace          OCHAMA
                                  │
                         gráfico / estudos
                         desenhos / viewport
                         interação / render
```

Ochama é a fundação visual.

Oraculum é o sistema de investigação.

---

# 20. VISÃO DE LONGO PRAZO

O sistema completo pode chegar a:

```
                 ORACULUM
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
      MERCADO     CONTEXTO    INVESTIGAÇÃO
        │            │            │
      ativos       variáveis     relações
      preços       eventos       hipóteses
      volume       notícias      testes
      estudos      ciclos        frameworks
                     │
                     ▼
                  WORKSPACE
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       gráfico    tabelas    análises
          │          │          │
          └──────────┼──────────┘
                     ▼
                  OALGO
                     │
                     ▼
                 OBACKTEST
```

O objetivo final não é simplesmente produzir mais gráficos.

É permitir que uma pessoa passe de:

**“O que está acontecendo?”**

para:

**“Com o que isso se relaciona?”**

depois:

**“Existe alguma estrutura temporal aqui?”**

depois:

**“Tenho uma hipótese.”**

depois:

**“Consigo testar?”**

e finalmente:

**“Consigo transformar isso em uma regra?”**

---

# 21. BASELINE PARA A AUDITORIA

## Repositório

`4avalonuse/oraculum` — branch `main`.

## Estado de referência

O repositório contém a implementação gráfica copiada do Ochama e o primeiro esqueleto conceitual do Oraculum.

A tree atual contém:

- chart;
- drawing;
- interaction;
- viewport;
- studies;
- data;
- storage;
- ui;
- styles;
- src/oraculum com market, variables, events, workspace, analytics, oalgo e obacktest;
- documentação arquitetural anterior;
- testes existentes.

## Objetivo da próxima auditoria

Comparar:

```
VISÃO DEFINIDA
       ↓
TREE ATUAL
       ↓
CÓDIGO ATUAL
       ↓
DEPENDÊNCIAS
       ↓
RESPONSABILIDADES
       ↓
O QUE FICA
       ↓
O QUE MUDA
       ↓
O QUE FALTA
       ↓
TREE FINAL
```

## Regra

**Nenhum grande refactor deve ser feito antes da auditoria arquitetural.**

A próxima auditoria deve verificar arquivo por arquivo, módulo por módulo:

- responsabilidade;
- dependências;
- acoplamento;
- duplicação;
- fronteiras entre domínio e apresentação;
- reutilização da fundação Ochama;
- compatibilidade com a visão do Oraculum;
- necessidade real de cada nova camada.

---

# 22. DECISÃO DE ARQUITETURA

A decisão atual é:

> **Oraculum não será construído como um gráfico expandido. Será construído como um ambiente modular de investigação de mercado, utilizando o Ochama como sua fundação visual.**

A arquitetura deve permitir que o usuário:

```
ESCOLHA UM ATIVO
      ↓
ENTENDA O CONTEXTO
      ↓
VEJA O PASSADO E O FUTURO CONHECIDO
      ↓
INVESTIGUE RELAÇÕES
      ↓
MONTE UM MAPA
      ↓
ALINHE FRAMES
      ↓
ANOTE E COMPARE
      ↓
FORMULE HIPÓTESES
      ↓
TESTE
      ↓
TRANSFORME EM ALGO
```

Esta é a referência conceitual para a próxima auditoria.
