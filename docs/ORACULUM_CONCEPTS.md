# ORACULUM — CONCEITOS FUNDAMENTAIS

## ATIVO

Objeto de mercado que pode ser investigado: BTC, SOL, índice, ação, moeda, commodity etc.

Um ativo pode possuir preço, volume, estudos, eventos relacionados, variáveis contextuais, relações e histórico.

## VARIABLE

Medida ou série temporal observável.

Exemplos conceituais: inflação, juros, liquidez, DXY, emprego, yield, fluxo.

Contrato genérico previsto:

- id
- name
- category
- subcategory
- symbol
- country
- source
- unit
- frequency
- description

Não hardcodar CPI, GDP, FOMC ou outros casos individuais como estruturas diferentes.

## OBSERVATION

Valor de uma VARIABLE em determinado instante.

Campos conceituais:

- variable_id
- timestamp
- value
- revision
- source

## EVENT

Ocorrência datada que possui significado contextual.

Exemplos: divulgação econômica, decisão monetária, anúncio regulatório, evento geopolítico, evento corporativo.

Campos conceituais:

- id
- timestamp
- category
- type
- country
- title
- description
- source
- importance

EVENT não deve ser confundido com VARIABLE.

## RELATION

Representação de uma relação investigável entre objetos ou séries.

Pode carregar:

- objeto A
- objeto B
- método
- janela
- defasagem
- resultado
- período
- fonte
- limitações

Correlação não implica causalidade.

## LEAD/LAG

Investigação de deslocamento temporal entre séries ou eventos.

O sistema deve distinguir claramente:

- A antecede B;
- B antecede A;
- relação contemporânea;
- relação não detectada.

Isso é análise estatística, não promessa de previsão.

## TIMELINE

Eixo temporal que organiza observações, eventos, fatos, ciclos e marcos.

A Timeline deve permitir passado, presente e eventos futuros conhecidos/agendados.

## FRAME

Unidade visual/analítica que pode ser colocada no Workspace e alinhada temporalmente.

Um Frame pode representar um gráfico, série, evento, ciclo, índice, estudo ou composição de elementos.

## WORKSPACE

Ambiente de investigação editável.

O usuário pode colocar objetos, organizar Frames, alinhar tempo, sobrepor informações, desenhar e construir uma investigação.

Workspace não é apenas um canvas livre: ele possui contexto temporal e semântico.

## HYPOTHESIS

Proposição investigável criada pelo usuário.

Deve poder apontar para evidências, relações, períodos e testes.

## TEST

Procedimento que verifica uma hipótese ou propriedade observada.

Resultados devem preservar método, período, dados e limitações.

## FRAMEWORK

Conjunto reutilizável de objetos, relações, análises, Frames e hipóteses.

Deve ser editável e persistível.

## OALGO

Camada futura que transforma lógica investigada em algoritmo estruturado.

## OBACKTEST

Camada futura que testa algoritmos/hipóteses sobre histórico.

## OCHAMA

Fundação de visualização herdada e preservada dentro do Oraculum: gráfico, viewport, estudos, desenhos, interação e renderização.
