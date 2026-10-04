# ORACULUM — Especificação de Arquitetura

**Status:** arquitetura de referência  
**Branch de trabalho:** `main`  
**Escopo:** repositório `4avalonuse/oraculum`

---

## 1. Papel do repositório

ORACULUM é o ambiente central de **investigação, contexto e conhecimento** do ecossistema.

O repositório deve concentrar:

- Workspace e navegação;
- contexto de ativos e datasets;
- composição de estudos;
- timeline e eventos;
- variáveis e relações;
- hipóteses;
- resultados e referências de testes;
- persistência do contexto investigativo;
- integração por contratos com produtos externos.

O gráfico é uma capacidade do ORACULUM, mas **não é a entidade central do produto**.

A unidade central é a **investigação persistente**.

---

## 2. Fronteira dos produtos

Os seguintes sistemas são independentes e **não devem ser absorvidos por este repositório**:

| Produto | Responsabilidade |
|---|---|
| **ORACULUM** | investigação, contexto, Workspace e conhecimento |
| **Ochama** | exploração e visualização gráfica avançada |
| **OAlgo** | formalização, construção e manutenção de algoritmos |
| **OBacktest** | experimentação, backtests e análise de estratégias |
| **OWin** | execução/operação |

A comunicação entre eles ocorre por **contratos, APIs, identificadores, versões e referências persistentes**.

Não copiar implementações internas do Ochama, OAlgo, OBacktest ou OWin para o ORACULUM.

---

## 3. Princípio arquitetural

> **ORACULUM coordena; os produtos especializados executam suas próprias responsabilidades.**

Fluxo conceitual:

```
                    ORACULUM
              investigação/contexto
                       |
          +------------+------------+
          |            |            |
       Ochama        OAlgo      OBacktest
       visual         regras       testes
          |            |            |
          +------------+------------+
                       |
                      OWin
                   execução
```

O fluxo não é necessariamente linear. Resultados de um produto podem retornar ao Workspace como nova evidência, observação ou hipótese.

---

## 4. Princípio de camadas

O ORACULUM deve permitir profundidade progressiva:

### Camada 1 — exploração
- ativo;
- período;
- gráfico;
- timeline;
- eventos;
- comparação.

### Camada 2 — análise
- retornos;
- transformações;
- normalização;
- deflação;
- volatilidade;
- correlação;
- lead/lag.

### Camada 3 — matemática
- vetores;
- módulos;
- direções e sentidos;
- transformações;
- ângulos;
- produto escalar;
- projeções;
- decomposições;
- distâncias e similaridades.

### Camada 4 — estatística/econometria
- regressões;
- testes estatísticos;
- estacionariedade;
- cointegração;
- modelos temporais;
- regimes;
- análise de resíduos;
- robustez.

### Camada 5 — algoritmo
OAlgo.

### Camada 6 — experimentação
OBacktest.

### Camada 7 — aplicação
OWin.

**Regra:** começar simples sem fechar a arquitetura para as camadas posteriores.

---

## 5. Modelo de domínio

Entidades conceituais:

- **WORKSPACE** — investigação persistente.
- **ASSET** — ativo.
- **DATASET** — fonte/mercado/intervalo.
- **VARIABLE** — variável observável ou derivada.
- **OBSERVATION** — valor de uma variável em um instante.
- **EVENT** — acontecimento temporal classificado.
- **RELATION** — relação entre entidades ou séries.
- **TIMELINE** — estrutura temporal compartilhada.
- **FRAME** — recorte temporal/contextual.
- **HYPOTHESIS** — afirmação investigável.
- **TEST** — experimento associado a uma hipótese.
- **RESULT** — resultado/referência produzida por uma análise ou sistema externo.
- **CONCLUSION** — interpretação registrada.

### Estados de hipótese

Uma hipótese pode ser:

- `open`
- `supported`
- `refuted`
- `inconclusive`

A arquitetura deve permitir **refutação e inconclusão** como resultados válidos.

---

## 6. Workspace

O Workspace é o núcleo persistente.

Ele pode conter:

```
Workspace
├── assets
├── datasets
├── variables
├── observations
├── events
├── timelines
├── frames
├── relations
├── hypotheses
├── tests
├── results
└── conclusions
```

Cada objeto temporal deve preservar:

- identidade;
- origem;
- período;
- relação com o Workspace;
- transformação aplicada;
- versão quando relevante.

O Workspace não é apenas uma pasta. Ele representa o **estado de conhecimento de uma investigação**.

---

## 7. Tempo como dimensão de primeira classe

O tempo é estrutural.

O sistema deve permitir responder:

- quando ocorreu;
- qual janela foi utilizada;
- qual evento estava ativo;
- o que ocorreu antes;
- o que ocorreu depois;
- qual foi a defasagem;
- qual período foi comparado.

Isso sustenta:

- ciclos;
- halvings;
- eventos;
- lead/lag;
- comparações alinhadas;
- walk-forward;
- regimes;
- estudos pré/pós-evento.

---

## 8. Eventos

Eventos devem ser classificados, não lançados como elementos soltos no gráfico.

Categorias podem incluir:

- Crypto;
- Macro;
- Regulation;
- Liquidity;
- Market;
- outras categorias extensíveis.

Um evento deve possuir, no mínimo:

```
id
timestamp
type/category
title
source
impact
metadata
```

A apresentação visual deve permanecer seletiva para evitar poluição do gráfico.

---

## 9. Dados e Data API

A fundação atual é:

```
Yahoo / Binance.US
        ↓
Cloudflare Worker
        ↓
D1
        ↓
Data API
        ↓
ORACULUM
        ↓
normalização
        ↓
visualização/análise
```

Backend atual:

- Worker: `oraculum-data-api`
- banco: Cloudflare D1
- tabelas-base: `datasets`, `candles`, `api_meta`

O ORACULUM não deve criar um segundo backend apenas para duplicar essa função.

---

## 10. Contrato interno de candles

O contrato canônico utilizado pela aplicação é:

```js
{
  timestamp,
  open,
  high,
  low,
  close,
  volume
}
```

Regras:

- timestamp interno em milissegundos;
- OHLC numérico;
- high >= open/close/low;
- low <= open/close/high;
- volume não negativo;
- timestamps ordenados;
- timestamps duplicados rejeitados.

A normalização existente em `src/data/normalize.js` é a fronteira entre dados externos e o domínio gráfico.

---

## 11. Resolução de datasets

Datasets devem ser identificados semanticamente por:

```
provider
symbol
kind
interval
currency
```

O `dataset.id` é um identificador de armazenamento, não deve substituir os atributos semânticos do dataset no domínio.

---

## 12. Arquitetura de código

A direção de módulos é:

```
src/
├── app.js
├── data/
│   ├── client.js
│   └── normalize.js
├── api/
├── logic/
├── chart/
│   ├── viewport.js
│   ├── render.js
│   ├── interaction.js
│   └── controls.js
├── render/
├── ui/
├── storage/
├── workspace/
└── integrations/
```

### Responsabilidades

**data/**
- contratos de dados;
- normalização;
- preparação de séries.

**api/**
- comunicação externa genérica;
- endpoints e adapters.

**logic/**
- regras de domínio;
- cálculos;
- transformações.

**chart/**
- viewport;
- renderização;
- interação;
- controles específicos do gráfico.

**render/**
- composição visual que não pertence exclusivamente ao canvas.

**ui/**
- controles de interface;
- menus;
- estados visuais.

**storage/**
- persistência local/remota;
- serialização do Workspace.

**workspace/**
- composição e estado da investigação.

**integrations/**
- contratos com Ochama/OAlgo/OBacktest/OWin.

---

## 13. Regra para app.js

`app.js` deve ser apenas o **composition root**.

Ele pode:

- inicializar dependências;
- conectar módulos;
- registrar listeners;
- iniciar a aplicação.

Ele não deve acumular:

- cálculos estatísticos;
- renderização complexa;
- regras de eventos;
- lógica de Workspace;
- integração externa;
- algoritmos de análise.

A implementação atual ainda contém responsabilidades que devem ser extraídas progressivamente. A arquitetura futura deve preservar `app.js` pequeno.

---

## 14. Gráfico do ORACULUM

O gráfico interno deve permanecer deliberadamente mais simples que o Ochama.

Capacidades fundamentais:

- candle;
- line;
- Fit;
- zoom;
- pan;
- escala normal;
- escala log;
- timeframes H/D/W/M;
- eventos;
- comparação;
- dados reais.

O comportamento gráfico deve ser confiável antes de adicionar complexidade.

Recursos avançados de desenho e estudos pertencem ao Ochama.

---

## 15. Integração com Ochama

O ORACULUM pode abrir ou incorporar uma experiência do Ochama por contrato.

O princípio é:

> **ORACULUM decide o contexto; Ochama fornece profundidade visual.**

O Workspace deve conseguir referenciar:

- ativo;
- período;
- dataset;
- configuração;
- estado relevante;
- versão do produto.

O ORACULUM não deve copiar o motor interno do Ochama.

---

## 16. OAlgo como integração

OAlgo recebe do ORACULUM uma hipótese formalizada.

Contrato conceitual:

```
Workspace
   ↓
Hypothesis
   ↓
Variables
   ↓
Transformations
   ↓
Rule specification
   ↓
OAlgo
```

A referência deve preservar:

- workspace_id;
- hypothesis_id;
- versão do algoritmo;
- parâmetros;
- datasets utilizados;
- janela temporal.

---

## 17. OBacktest como integração

OBacktest deve permanecer independente e livre para testar:

- múltiplos algoritmos;
- múltiplos ativos;
- múltiplos períodos;
- parâmetros;
- custos;
- slippage;
- regimes;
- defasagens;
- diferentes condições.

O ORACULUM guarda o **contexto e a referência do experimento**.

OBacktest executa o experimento.

Contrato conceitual:

```
Hypothesis
   ↓
Algorithm version
   ↓
Experiment specification
   ↓
OBacktest
   ↓
Result
   ↓
ORACULUM
```

---

## 18. Rigor experimental

O ecossistema deve suportar, progressivamente:

- walk-forward;
- custos;
- slippage;
- disponibilidade temporal;
- prevenção de look-ahead;
- múltiplos regimes;
- defasagens;
- comparação entre períodos;
- versionamento;
- reprodução;
- análise de sensibilidade;
- testes de robustez.

Nenhum resultado deve ser tratado como verdade apenas porque apresentou bom desempenho.

---

## 19. Camada matemática

A camada matemática não é um produto separado.

É uma biblioteca de representação/análise que pode ser utilizada pelo OAlgo e pelo próprio ORACULUM quando fizer sentido.

Exemplos:

### Vetores

[
v=(x,y)
]

### Módulo

[
|v|=sqrt{x^2+y^2}
]

### Produto escalar

[
Acdot B=A_xB_x+A_yB_y
]

ou:

[
Acdot B=|A||B|cos	heta
]

### Projeção

[
operatorname{proj}_B(A)
=
rac{Acdot B}{|B|^2}B
]

### Decomposição

[
A=A_{parallel}+A_{perp}
]

Essas operações podem futuramente representar relações entre séries ou estados multidimensionais.

---

## 20. Cuidado com unidades

Variáveis de naturezas diferentes não devem ser tratadas como eixos geometricamente equivalentes sem transformação explícita.

Exemplo:

```
tempo
preço
volume
volatilidade
taxa
```

podem possuir escalas e unidades incompatíveis.

Antes de uma operação geométrica, o sistema deve registrar a transformação:

- normalização;
- padronização;
- retorno;
- log-retorno;
- deflação;
- z-score;
- outra transformação definida.

A transformação faz parte da evidência e precisa ser reproduzível.

---

## 21. Comparação de ativos

Comparar preços nominais diretamente nem sempre é adequado.

O sistema deve permitir representações como:

- base 100;
- retorno acumulado;
- log-preço;
- log-retorno;
- z-score;
- volatilidade;
- drawdown;
- características normalizadas.

A representação deve ser escolhida de acordo com a pergunta investigativa.

---

## 22. Qualitativo + quantitativo

O sistema deve conectar:

**Quantitativo**
- preço;
- volume;
- retorno;
- volatilidade;
- indicadores;
- séries macro;
- variáveis derivadas.

**Qualitativo**
- notícias;
- decisões;
- anúncios;
- mudanças regulatórias;
- acontecimentos;
- eventos de mercado.

A conexão deve ser temporal e semântica.

O sistema não deve presumir causalidade.

---

## 23. Relações

Uma `RELATION` pode representar:

- correlação;
- dependência;
- precedência;
- lead/lag;
- comparação;
- relação temporal;
- relação matemática.

Exemplo:

```
BTC return
    ↕ correlation
SOL return
```

ou:

```
Event
  ↓
lag = +3
  ↓
price response
```

A relação deve guardar o método e, quando necessário, seus parâmetros.

---

## 24. Hipótese

Uma hipótese deve ser uma afirmação testável.

Exemplo:

> "Após determinado evento, o ativo apresenta alteração estatisticamente relevante em uma janela definida."

Uma hipótese deve permitir registrar:

```
statement
variables
window
conditions
transformations
status
tests
evidence
conclusion
```

---

## 25. Resultado

Resultados externos não devem ser copiados indiscriminadamente para o ORACULUM.

Devem ser referenciados.

Exemplo:

```
external_system: OBacktest
external_id: bt_123
version: 4
status: completed
result_reference: ...
```

Isso mantém os sistemas desacoplados.

---

## 26. Reprodutibilidade

Uma investigação relevante deve conseguir responder:

> "Como este resultado foi produzido?"

Portanto, quando aplicável, registrar:

- dataset;
- provider;
- intervalo;
- janela;
- versão;
- transformação;
- parâmetros;
- algoritmo;
- código/referência;
- timestamp de execução;
- resultado.

---

## 27. O que é implementação atual

### Já presente

- shell simples;
- gráfico interno;
- candles;
- line;
- Fit;
- zoom/pan;
- escala normal/log;
- H/D/W/M;
- Data API;
- normalização de candles;
- timeline de eventos;
- categorias de eventos;
- comparação BTC/SOL;
- métricas estatísticas iniciais;
- análise completa BTC/SOL;
- documentação de domínio;
- separação conceitual dos produtos.

### Em evolução

- Workspace persistente;
- navegação investigativa;
- abstração de variáveis;
- relações;
- hipóteses;
- armazenamento do contexto;
- contratos externos formais.

### Futuro

- biblioteca matemática;
- econometria;
- testes estatísticos mais profundos;
- integração formal com OAlgo;
- integração formal com OBacktest;
- integração formal com OWin;
- missões/conversações persistentes;
- reprodutibilidade completa.

---

## 28. Estado do repositório hoje

A reconstrução atual é deliberadamente simples.

O código existente já possui uma primeira separação:

```
data → dados
chart → gráfico
app → composição
```

A arquitetura documentada amplia essa separação para:

```
data
logic
render
ui
storage
api
workspace
integrations
```

Essas pastas não precisam ser preenchidas artificialmente agora.

Elas representam **fronteiras de responsabilidade**.

Criar uma pasta sem necessidade não é objetivo.

---

## 29. Estratégia de evolução

A evolução deve ser incremental.

Ordem recomendada:

1. estabilizar shell e gráfico;
2. separar responsabilidades que crescerem demais;
3. consolidar Workspace;
4. persistir investigação;
5. formalizar eventos/variáveis/relações;
6. criar contratos de integração;
7. conectar Ochama;
8. conectar OAlgo;
9. conectar OBacktest;
10. conectar OWin;
11. aprofundar matemática/econometria.

Não antecipar infraestrutura de sistemas que ainda não precisam existir.

---

## 30. Git e segurança de evolução

A branch principal de desenvolvimento é:

```
main
```

O fluxo de trabalho preferencial é testar diretamente na `main`.

Branches podem existir como salvaguarda quando necessário, mas não devem virar o fluxo principal de desenvolvimento.

Cada alteração deve procurar ser:

- pequena;
- verificável;
- reversível;
- modular;
- compatível com o contrato existente.

---

## 31. Critério de qualidade

Uma mudança é considerada arquiteturalmente boa quando:

1. resolve o problema atual;
2. não destrói funcionalidades já estáveis;
3. mantém separação de responsabilidades;
4. não absorve outro produto;
5. preserva dados e contexto;
6. é reproduzível;
7. é compreensível;
8. pode ser substituída sem reescrever o sistema inteiro.

---

## 32. Regra final

O ORACULUM deve permanecer:

**simples na entrada, profundo na investigação, modular na arquitetura e rigoroso na evidência.**

A arquitetura existe para permitir que uma observação evolua até uma conclusão verificável sem perder:

- contexto;
- dados;
- transformações;
- tempo;
- hipóteses;
- método;
- versão;
- resultado.

Esse é o contrato estrutural do projeto.
