import { Cellule } from '../../domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../domain/intrigue/OperationClandestine.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeCellule(cellule) {
  if (cellule instanceof Cellule) {
    return new Cellule(cellule.toJSON());
  }

  if (cellule === null || typeof cellule !== 'object' || Array.isArray(cellule)) {
    throw new TypeError('InMemoryIntrigueRepository cellule must be an object.');
  }

  return new Cellule(cellule);
}

function normalizeOperation(operation) {
  if (operation instanceof OperationClandestine) {
    return new OperationClandestine(operation.toJSON());
  }

  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new TypeError('InMemoryIntrigueRepository operation must be an object.');
  }

  return new OperationClandestine(operation);
}

export class InMemoryIntrigueRepository {
  constructor({ cellules = [], operations = [] } = {}) {
    if (!Array.isArray(cellules)) {
      throw new TypeError('InMemoryIntrigueRepository cellules must be an array.');
    }

    if (!Array.isArray(operations)) {
      throw new TypeError('InMemoryIntrigueRepository operations must be an array.');
    }

    this.cellulesById = new Map();
    this.operationsById = new Map();

    for (const cellule of cellules) {
      const normalizedCellule = normalizeCellule(cellule);
      this.cellulesById.set(normalizedCellule.id, normalizedCellule);
    }

    for (const operation of operations) {
      const normalizedOperation = normalizeOperation(operation);
      this.operationsById.set(normalizedOperation.id, normalizedOperation);
    }
  }

  async getCelluleById(celluleId) {
    const normalizedCelluleId = requireText(celluleId, 'InMemoryIntrigueRepository celluleId');
    const cellule = this.cellulesById.get(normalizedCelluleId);
    return cellule ? new Cellule(cellule.toJSON()) : null;
  }

  async saveCellule(cellule) {
    const normalizedCellule = normalizeCellule(cellule);
    this.cellulesById.set(normalizedCellule.id, normalizedCellule);
    return new Cellule(normalizedCellule.toJSON());
  }

  async listCellulesByFaction(factionId) {
    const normalizedFactionId = requireText(factionId, 'InMemoryIntrigueRepository factionId');

    return [...this.cellulesById.values()]
      .filter((cellule) => cellule.factionId === normalizedFactionId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((cellule) => new Cellule(cellule.toJSON()));
  }

  async getOperationById(operationId) {
    const normalizedOperationId = requireText(operationId, 'InMemoryIntrigueRepository operationId');
    const operation = this.operationsById.get(normalizedOperationId);
    return operation ? new OperationClandestine(operation.toJSON()) : null;
  }

  async saveOperation(operation) {
    const normalizedOperation = normalizeOperation(operation);
    this.operationsById.set(normalizedOperation.id, normalizedOperation);
    return new OperationClandestine(normalizedOperation.toJSON());
  }

  async listOperationsByCellule(celluleId) {
    const normalizedCelluleId = requireText(celluleId, 'InMemoryIntrigueRepository celluleId');

    return [...this.operationsById.values()]
      .filter((operation) => operation.celluleId === normalizedCelluleId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((operation) => new OperationClandestine(operation.toJSON()));
  }

  snapshot() {
    return {
      cellules: [...this.cellulesById.values()]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((cellule) => cellule.toJSON()),
      operations: [...this.operationsById.values()]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((operation) => operation.toJSON()),
    };
  }
}
