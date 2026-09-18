const QUICK_RANGES = [
  ['7d', '7 dias', 7],
  ['30d', '30 dias', 30],
  ['90d', '90 dias', 90],
  ['6m', '6 meses', 182],
  ['1y', '1 ano', 365],
  ['5y', '5 anos', 1826],
  ['10y', '10 anos', 3652],
  ['all', 'Todo o período', null]
];

export class AnalysisPeriods {
  constructor(root, { onChange } = {}) {
    this.root = root;
    this.onChange = typeof onChange === 'function' ? onChange : null;
    this.datasetId = null;
    this.rows = [];
    this.bounds = null;
    this.state = {
      active: 'full',
      quick: 'all',
      a: { start: '', end: '' },
      b: { start: '', end: '' }
    };
  }

  setDataset(datasetId, rows) {
    this.datasetId = datasetId;
    this.rows = Array.isArray(rows) ? rows.slice() : [];
    const bounds = this._bounds();
    this.bounds = bounds;
    if (!bounds) return;
    const saved = this._read();
    this.state = { ...this.state, ...(saved || {}) };
    this.state.a = { ...this.state.a, ...(saved?.a || {}) };
    this.state.b = { ...this.state.b, ...(saved?.b || {}) };
    this._clamp(bounds);
    this.render(bounds);
  }

  get() {
    return JSON.parse(JSON.stringify(this.state));
  }

  filter(rows = this.rows, active = this.state.active) {
    if (active === 'full') {
      return this._filterQuick(rows);
    }

    const range = this.state[active];
    if (!range?.start || !range?.end) return rows.slice();
    const start = new Date(range.start + 'T00:00:00').getTime();
    const end = new Date(range.end + 'T23:59:59.999').getTime();
    return rows.filter(row => Number(row.t) >= start && Number(row.t) <= end);
  }

  _filterQuick(rows) {
    if (this.state.quick === 'all') return rows.slice();
    const preset = QUICK_RANGES.find(([key]) => key === this.state.quick);
    if (!preset || !this.bounds) return rows.slice();
    const days = preset[2];
    const end = this.bounds.max;
    const start = Math.max(this.bounds.min, end - ((days - 1) * 86400000));
    return rows.filter(row => Number(row.t) >= start && Number(row.t) <= end);
  }

  _bounds() {
    if (!this.rows.length) return null;
    const times = this.rows.map(r => Number(r.t)).filter(Number.isFinite);
    if (!times.length) return null;
    return { min: Math.min(...times), max: Math.max(...times) };
  }

  _defaults(bounds) {
    const day = 86400000;
    const maxDate = new Date(bounds.max);
    const end = this._date(maxDate);
    const aEnd = end;
    const aStart = this._date(new Date(bounds.max - 29 * day));
    const bEnd = this._date(new Date(bounds.max - 30 * day));
    const bStart = this._date(new Date(bounds.max - 59 * day));
    return {
      active: 'full',
      quick: 'all',
      a: { start: this._maxDate(aStart, bounds.min), end: this._minDate(aEnd, bounds.max) },
      b: { start: this._maxDate(bStart, bounds.min), end: this._minDate(bEnd, bounds.max) }
    };
  }

  _date(d) {
    return d.toISOString().slice(0, 10);
  }

  _maxDate(value, minTs) {
    const min = this._date(new Date(minTs));
    return value < min ? min : value;
  }

  _minDate(value, maxTs) {
    const max = this._date(new Date(maxTs));
    return value > max ? max : value;
  }

  _clamp(bounds) {
    const min = this._date(new Date(bounds.min));
    const max = this._date(new Date(bounds.max));
    for (const key of ['a', 'b']) {
      this.state[key].start = this.state[key].start < min ? min : this.state[key].start > max ? max : this.state[key].start;
      this.state[key].end = this.state[key].end < min ? min : this.state[key].end > max ? max : this.state[key].end;
      if (this.state[key].start > this.state[key].end) {
        const t = this.state[key].start;
        this.state[key].start = this.state[key].end;
        this.state[key].end = t;
      }
    }
  }

  _read() {
    if (!this.datasetId) return null;
    try {
      const raw = localStorage.getItem(`ochart:periods:${this.datasetId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  _save() {
    try {
      localStorage.setItem(`ochart:periods:${this.datasetId}`, JSON.stringify(this.state));
    } catch (_) {}
  }

  render(bounds) {
    const min = this._date(new Date(bounds.min));
    const max = this._date(new Date(bounds.max));
    this.root.innerHTML = `
      <div class="periods-head">
        <div>
          <span class="toolbar-label">Períodos de análise</span>
          <span class="subtle">A e B ficam disponíveis para a análise; a janela rápida controla a visualização.</span>
        </div>
        <div class="periods-mode seg">
          <button data-period="full" class="${this.state.active === 'full' ? 'active' : ''}">Janela rápida</button>
          <button data-period="a" class="${this.state.active === 'a' ? 'active' : ''}">Período A</button>
          <button data-period="b" class="${this.state.active === 'b' ? 'active' : ''}">Período B</button>
        </div>
      </div>
      <div class="quick-ranges">
        ${QUICK_RANGES.map(([key, label]) => `<button data-quick="${key}" class="${this.state.active === 'full' && this.state.quick === key ? 'active' : ''}">${label}</button>`).join('')}
      </div>
      <div class="periods-grid">
        ${this._rangeMarkup('a', 'Período A', min, max)}
        ${this._rangeMarkup('b', 'Período B', min, max)}
      </div>
    `;

    this.root.querySelectorAll('[data-period]').forEach(btn => {
      btn.onclick = () => {
        this.state.active = btn.dataset.period;
        this._save();
        this.render(bounds);
        this.onChange?.(this.get());
      };
    });

    this.root.querySelectorAll('[data-quick]').forEach(btn => {
      btn.onclick = () => {
        this.state.active = 'full';
        this.state.quick = btn.dataset.quick;
        this._save();
        this.render(bounds);
        this.onChange?.(this.get());
      };
    });

    for (const key of ['a', 'b']) {
      const start = this.root.querySelector(`#period-${key}-start`);
      const end = this.root.querySelector(`#period-${key}-end`);
      start.onchange = () => this._change(key, start.value, end.value, bounds);
      end.onchange = () => this._change(key, start.value, end.value, bounds);
    }
  }

  _rangeMarkup(key, label, min, max) {
    const r = this.state[key];
    return `
      <div class="period-box">
        <strong>${label}</strong>
        <label>Início<input id="period-${key}-start" type="date" min="${min}" max="${max}" value="${r.start}"></label>
        <label>Fim<input id="period-${key}-end" type="date" min="${min}" max="${max}" value="${r.end}"></label>
      </div>
    `;
  }

  _change(key, start, end, bounds) {
    this.state[key] = { start, end };
    this._clamp(bounds);
    this._save();
    this.render(bounds);
    this.onChange?.(this.get());
  }
}
