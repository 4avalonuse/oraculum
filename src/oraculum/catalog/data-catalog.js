export const ORACULUM_DATA_CATALOG = Object.freeze({
  assets: [{ id: 'btc-usd', symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', source: 'Yahoo Finance', sourceSymbol: 'BTC-USD', currency: 'USD' }],
  events: [
    { id: 'btc-halving-2012', date: '2012-11-28', title: 'Bitcoin Halving 2012', block: 210000, rewardBefore: 50, rewardAfter: 25, source: 'Bitcoin.org' },
    { id: 'btc-halving-2016', date: '2016-07-09', title: 'Bitcoin Halving 2016', block: 420000, rewardBefore: 25, rewardAfter: 12.5, source: 'Bitcoin.org' },
    { id: 'btc-halving-2020', date: '2020-05-11', title: 'Bitcoin Halving 2020', block: 630000, rewardBefore: 12.5, rewardAfter: 6.25, source: 'Bitcoin.org' },
    { id: 'btc-halving-2024', date: '2024-04-20', title: 'Bitcoin Halving 2024', block: 840000, rewardBefore: 6.25, rewardAfter: 3.125, source: 'Bitcoin.org' }
  ],
  variables: [
    { id: 'us-treasury-13w', name: 'US Treasury 13W', symbol: '^IRX', unit: '%', frequency: 'daily', source: 'Yahoo Finance' },
    { id: 'us-treasury-5y', name: 'US Treasury 5Y', symbol: '^FVX', unit: '%', frequency: 'daily', source: 'Yahoo Finance' },
    { id: 'us-treasury-10y', name: 'US Treasury 10Y', symbol: '^TNX', unit: '%', frequency: 'daily', source: 'Yahoo Finance' },
    { id: 'us-treasury-30y', name: 'US Treasury 30Y', symbol: '^TYX', unit: '%', frequency: 'daily', source: 'Yahoo Finance' }
  ]
});
