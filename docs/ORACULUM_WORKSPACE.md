# ORACULUM — WORKSPACE E FRAMES

## Objetivo

O Workspace é o laboratório do Oraculum.

Ele permite transformar informação dispersa em um mapa temporal investigável.

## Objetos

Objetos possíveis:

- Asset
- Variable
- Observation
- Event
- Cycle
- Index
- Chart
- Study
- Relation
- Frame
- Analysis
- Hypothesis
- Annotation

## Frame

Um Frame é uma representação visual/analítica de um ou mais objetos.

Exemplos:

- preço do BTC;
- DXY;
- liquidez;
- juros;
- calendário de eventos;
- gráfico de volatilidade;
- resultado de correlação.

## Alinhamento

Frames devem poder compartilhar:

- início/fim temporal;
- escala temporal;
- cursor temporal;
- marcadores;
- eventos;
- regiões destacadas.

O alinhamento deve usar tempo/identidade de mercado, não posição física de pixels.

## Camadas

O Workspace deve separar conceitualmente:

1. dados;
2. visualização;
3. eventos/contexto;
4. análises;
5. desenhos/anotações;
6. interação.

## Mapa

O posicionamento espacial ajuda o usuário a organizar o raciocínio, mas não deve alterar os dados originais.

## Persistência

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

## Futuro

A mesma estrutura deve poder alimentar Frameworks reutilizáveis e análises automatizadas.
