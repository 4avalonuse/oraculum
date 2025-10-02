// hub/bus.js
const Bus = {
  _events: {},

  emit(event, payload) {
    (this._events[event] || []).forEach(cb => cb(payload));
  },

  on(event, cb) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(cb);
  }
};

// export padrão e nomeado, para compatibilidade
export default Bus;
export const eventBus = Bus;
