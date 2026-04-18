import { WarEventBusPort } from '../../application/war/WarEventBusPort.js';

export class InMemoryWarEventBus extends WarEventBusPort {
  constructor(events = []) {
    super();
    this.events = [];
    this.seed(events);
  }

  seed(events) {
    if (!Array.isArray(events)) {
      throw new TypeError('InMemoryWarEventBus events must be an array.');
    }

    for (const event of events) {
      if (!event || typeof event !== 'object' || Array.isArray(event)) {
        throw new TypeError('InMemoryWarEventBus event must be an object.');
      }

      const eventName = String(event.eventName ?? '').trim();
      const payload = event.payload;

      if (!eventName) {
        throw new RangeError('InMemoryWarEventBus eventName is required.');
      }

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new TypeError('InMemoryWarEventBus payload must be an object.');
      }

      this.events.push({ eventName, payload: { ...payload } });
    }

    return this;
  }

  async publish(eventName, payload) {
    const record = {
      eventName: String(eventName).trim(),
      payload: { ...payload },
    };
    this.events.push(record);
    return record;
  }

  snapshot() {
    return this.events.map((event) => ({
      eventName: event.eventName,
      payload: { ...event.payload },
    }));
  }
}
