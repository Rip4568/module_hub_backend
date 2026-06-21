const Sequencer = require('@jest/test-sequencer').default;

class E2ESequencer extends Sequencer {
  sort(tests) {
    const priority = [
      'auth.e2e-spec.ts',
      'products.e2e-spec.ts',
      'vehicles.e2e-spec.ts',
      'inventory.e2e-spec.ts',
      'modules.e2e-spec.ts',
      'orders.e2e-spec.ts',
    ];

    return [...tests].sort((testA, testB) => {
      const indexA = priority.findIndex((name) => testA.path.endsWith(name));
      const indexB = priority.findIndex((name) => testB.path.endsWith(name));
      const rankA = indexA === -1 ? priority.length : indexA;
      const rankB = indexB === -1 ? priority.length : indexB;
      return rankA - rankB || testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = E2ESequencer;
