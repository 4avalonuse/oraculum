# ORACULUM — Visão do Workspace e Ambiente de Investigação

**Documento conceitual / arquitetural**  
**Estado:** visão definida, implementação futura  
**Projeto:** OChart / Oraculum

## 1. A mudança de visão

O OChart começou como um sistema de visualização de gráficos. A evolução desejada é maior: o OChart deve se tornar um ambiente visual para pensar, investigar e construir análises sobre mercados e dados.

A unidade principal deixa de ser necessariamente o gráfico individual. Passa a existir um **Workspace**: um espaço de investigação no qual gráficos, dados, estudos, eventos e outras informações podem coexistir e se relacionar.

## 2. Workspace

O Workspace pode conter:
- um ou vários gráficos;
- o mesmo ativo em diferentes períodos;
- ativos diferentes;
- índices e indicadores;
- estudos estatísticos;
- eventos e notícias;
- anotações;
- comparações;
- layers;
- outros elementos futuros.

Não deve ser apenas um dashboard tradicional: é um **espaço de investigação**.

## 3. Liberdade com organização

Princípio central:

> Liberdade não significa deixar tudo solto. Organização não significa limitar a liberdade.

O usuário deve poder adicionar, mover, redimensionar, duplicar, comparar, sobrepor, sincronizar, aproximar, afastar, desfazer e retornar ao estado padrão sem ser soterrado por controles.

## 4. Painéis

Cada elemento pode ocupar um **Panel**, com formatos e tamanhos diferentes: quadrado, retângulo horizontal/vertical, grande área ou pequeno elemento auxiliar.

Exemplo conceitual:

```
┌───────────────────────────────┐
│ BTC — 4 ANOS                  │
│       gráfico principal       │
└───────────────────────────────┘
┌───────────────┐ ┌───────────────┐
│ BTC — 1 DIA   │ │ DXY           │
└───────────────┘ └───────────────┘
┌───────────────────────────────┐
│ EVENTOS / NOTÍCIAS            │
└───────────────────────────────┘
```

## 5. Mesmo ativo em diferentes escalas

O mesmo ativo pode aparecer em perspectivas diferentes:

- BTC — 4 anos
- BTC — 1 ano
- BTC — 1 mês
- BTC — 1 semana
- BTC — 1 dia
- BTC — 1 hora

O período deixa de ser apenas uma configuração do gráfico e passa a ser uma perspectiva de investigação.

## 6. Zoom espacial

O Workspace terá um conceito diferente do zoom temporal do gráfico.

- **Zoom temporal:** aproxima/afasta o período de um gráfico.
- **Zoom espacial:** aproxima/afasta o próprio Workspace.

A navegação conceitual:

**MAPA → CONTEXTO → INVESTIGAÇÃO → FOCO**

### Nível 0 — MAPA
Visão geral de todos os elementos.

### Nível 1 — CONTEXTO
Um grupo ganha destaque enquanto os demais continuam presentes.

### Nível 2 — INVESTIGAÇÃO
Um conjunto específico ocupa a maior parte da tela.

### Nível 3 — FOCO
Um elemento ocupa praticamente toda a experiência. Aqui o OChart atual pode funcionar como instrumento completo.

## 7. Layers

Uma **Layer** é informação que pode atravessar múltiplos painéis.

Exemplo: um evento FOMC pode ser aplicado a BTC, ETH, DXY e S&P na mesma posição temporal.

Layers podem ser aplicadas a:
- um gráfico;
- vários gráficos;
- todos os gráficos;
- grupos específicos.

## 8. Sincronização

Os elementos podem compartilhar relações:

### Sincronização temporal
Mover o período de um gráfico pode mover outros.

### Sincronização de eventos
Um evento aparece na mesma posição temporal em diferentes gráficos.

### Sincronização de comparação
Ativos podem compartilhar uma referência.

### Sincronização seletiva
O usuário escolhe quais painéis participam.

Sincronização é uma ferramenta, não uma obrigação.

## 9. Modo de criação

A entrada principal pode ser um **＋** discreto.

Categorias iniciais:
- Gráfico
- Indicador
- Comparação
- Evento
- Notícia
- Estudo
- Anotação
- Dados

O usuário deve poder pensar em **o que quer colocar no espaço**, sem precisar conhecer a arquitetura interna.

## 10. Restaurar

Deve existir uma ação global como **Restaurar padrão**.

Ela pode restaurar:
- posição;
- tamanho;
- zoom espacial;
- sincronizações;
- layers temporárias;
- estudos temporários;
- organização visual.

Isso não deve necessariamente apagar o Workspace salvo. Deve existir distinção entre **estado atual** e **estado salvo**.

## 11. Experiência mobile

O celular não deve tentar imitar um desktop.

A experiência mobile deve usar a mesma lógica, mas interação própria:

- pinça: aproxima/afasta o Workspace;
- toque: entra em um painel;
- toque prolongado: manipulação contextual;
- gestos: navegação espacial;
- foco: painel ocupa a tela.

O objetivo é permitir **Mapa → aproximação → foco** sem dezenas de controles visíveis.

## 12. Experiência desktop

O desktop poderá explorar mais liberdade espacial:
- múltiplos painéis;
- arrastar;
- redimensionar;
- sobreposição;
- múltiplas seleções;
- layers;
- comparação;
- atalhos;
- navegação espacial.

Desktop revela mais potencial; mobile oferece a mesma lógica adaptada.

## 13. Interface

A interface deve ser **futurista, inteligente e sutil**.

Futurismo não significa excesso de animação, efeitos decorativos ou aparência de ficção científica.

O futurismo deve surgir do comportamento:
- contexto;
- relações;
- aproximação;
- sincronização;
- poucos controles;
- preservação do espaço de trabalho;
- liberdade de investigação.

> O futuro do Oraculum deve estar mais no comportamento do que na aparência.

## 14. Lugar para criar

Dashboard tradicional **mostra informações**.

O Workspace do Oraculum **permite construir uma investigação**.

Uma investigação pode começar com um gráfico e evoluir para:

```
BTC
 ↓
DXY
 ↓
FOMC
 ↓
volatilidade
 ↓
retorno
 ↓
comparação histórica
 ↓
hipótese
```

Tudo dentro do mesmo espaço.

## 15. Relação com o OChart atual

O OChart atual não é descartado. Ele passa a ser o futuro **modo Focus** do Workspace.

Conceitualmente:

```
ORACULUM
   │
   └── OChart
         │
         ├── Workspace
         │     ├── Panels
         │     ├── Layers
         │     ├── Sync
         │     └── Navigation
         │
         └── Focus
               └── Chart Engine
```

O trabalho já realizado no OChart continua sendo a base operacional.

## 16. Arquitetura conceitual futura

Os conceitos principais são:

- **Workspace** — espaço completo de investigação.
- **Panel** — unidade visual.
- **Layer** — informação transversal.
- **Sync** — relacionamento entre elementos.
- **Navigation** — zoom e navegação espacial.
- **Focus** — entrada profunda em um elemento.
- **State** — estado atual.
- **Preset** — estado salvo/configuração reutilizável.

## 17. Relação com a evolução do Oraculum

O Workspace cria uma ponte natural:

```
OChart
  │
  ▼
WORKSPACE
  │
  ├── gráficos
  ├── indicadores
  ├── eventos
  ├── notícias
  ├── estudos
  ├── comparações
  │
  ▼
OAlgo
  │
  ▼
OBacktest
  │
  ▼
OWin
```

Uma investigação criada no Workspace poderá futuramente alimentar uma hipótese, regra, algoritmo, backtest, monitoramento ou operação.

## 18. Princípio de investigação

O Oraculum não deve começar tentando responder:

> “Qual ativo comprar?”

Primeiro deve ajudar o usuário a enxergar:

> **O que está acontecendo?**

Depois:

> **O que está relacionado?**

Depois:

> **Existe alguma estrutura?**

Depois:

> **Posso testar essa hipótese?**

E somente muito mais tarde:

> **Posso transformar isso em uma regra?**

## 19. Regra de desenvolvimento

A visão não significa implementar tudo imediatamente.

Evolução incremental:

**OChart sólido → Workspace mínimo → Panels → navegação espacial → Layers/Sync → estudos/eventos → OAlgo → OBacktest.**

A arquitetura deve permitir a evolução, mas a implementação deve acompanhar o uso.

> **Não construir abstrações antes de existir uma necessidade real.**

## 20. Síntese

> **O gráfico é o instrumento.  
> O Workspace é o lugar onde a investigação acontece.**

## Estado da visão

**Definido conceitualmente:**
- Workspace;
- painéis livres;
- diferentes tamanhos e formatos;
- mesmo ativo em diferentes períodos;
- múltiplos ativos;
- zoom espacial;
- Mapa → Contexto → Investigação → Foco;
- Layers transversais;
- sincronização;
- modo de criação;
- restaurar estado padrão;
- experiência própria para celular;
- experiência expandida para desktop;
- interface futurista, inteligente e sutil;
- OChart atual como futuro modo Focus;
- Workspace como ponte para estudos, OAlgo e OBacktest.

**Ainda não implementado:** a maior parte dessa camada permanece conceitual. O OChart atual continua sendo a base operacional.

**Princípio central:**

> **O Oraculum será um espaço visual de investigação onde o usuário pode organizar, conectar, comparar e explorar múltiplas perspectivas de dados sem perder a liberdade de criar.**
