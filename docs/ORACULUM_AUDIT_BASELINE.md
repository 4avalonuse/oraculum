# ORACULUM — BASELINE PARA AUDITORIA

## Repositório

4avalonuse/oraculum — branch main.

## Estado atual

O repositório contém a implementação gráfica copiada do Ochama e um primeiro esqueleto conceitual de Oraculum.

A árvore atual possui:

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
- documentação anterior em docs/.

## Avaliação arquitetural

### Já adequado

- separação da fundação gráfica;
- existência de domínio oraculum separado;
- market/variables/events/workspace/analytics/oalgo/obacktest como primeira decomposição;
- documentação arquitetural inicial;
- testes existentes para partes da fundação.

### Ainda incompleto

A árvore atual não possui módulos explícitos para:

- Asset Panel;
- Timeline;
- Relations;
- Frames;
- temporal alignment;
- Hypotheses;
- Frameworks.

Isso não significa que todas as pastas devam ser criadas imediatamente. São conceitos que precisam de contratos antes da implementação.

### Riscos

1. transformar Oraculum em Ochama com mais indicadores;
2. colocar lógica de domínio em bootstrap/UI;
3. misturar Event e Variable;
4. tratar correlação como causalidade;
5. criar uma árvore excessivamente profunda antes dos casos reais;
6. fazer Workspace depender diretamente de detalhes do renderer;
7. criar múltiplas implementações do mesmo conceito.

## Critério de aprovação da arquitetura

Uma mudança estrutural deve responder:

- qual conceito ela representa?
- quem é dono desse conceito?
- quais dados entram?
- quais dados saem?
- quem pode depender dele?
- ele é domínio, infraestrutura ou apresentação?
- pode ser testado sem o canvas?

## Direção

A próxima etapa é uma auditoria arquitetural detalhada da implementação existente contra esta visão.

Nenhum grande refactor deve ser feito antes dessa auditoria.
