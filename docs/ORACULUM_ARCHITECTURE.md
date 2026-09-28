# Oraculum — architecture baseline

## Principle

Oraculum is the analysis system. Ochama is its chart/visualization foundation.

## Layers

- MARKET — assets and market observations
- VARIABLES — measurable external/internal variables
- EVENTS — qualitative events and releases
- WORKSPACE — comparison and visual composition
- ANALYTICS — statistical/econometric relationships
- OALGO — algorithm construction
- OBACKTEST — hypothesis and algorithm testing

## Flow

OBSERVAR → COMPARAR → RELACIONAR → FORMULAR HIPÓTESE → TESTAR → ALGO

## Data model rule

Do not hard-code individual macro indicators into application logic. Use generic VARIABLE and OBSERVATION contracts so CPI, GDP, rates and future series use the same model.

Keep EVENT separate from VARIABLE because an event is an occurrence, while a variable is a time series.

## Chart foundation

The current Ochama implementation is copied into this repository as the initial visual layer. Future Oraculum modules should integrate with it rather than modify the standalone Ochama repository.

## Repository rule

From this point forward, Oraculum development happens in this repository. Ochama remains the preserved reference copy.
