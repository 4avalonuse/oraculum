import { ORACULUM_DATA_CATALOG } from '../../catalog/data-catalog.js';

export function getInvestigationCatalog() {
  return [
    ...ORACULUM_DATA_CATALOG.events.map(item => ({
      ...item, kind: 'EVENTO', label: item.title, detail: item.date
    })),
    ...ORACULUM_DATA_CATALOG.variables.map(item => ({
      ...item, kind: 'VARIÁVEL', label: item.name, detail: item.symbol
    }))
  ];
}
