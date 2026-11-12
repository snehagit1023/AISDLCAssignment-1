// FR-009, FR-010, FR-011, FR-014.
function createFakeAiClient(responses = []) {
  const calls = [];
  const queuedResponses = [...responses];

  return {
    calls,
    // FR-009, FR-011, FR-014.
    async analyze(request) {
      calls.push(request);
      const response = queuedResponses.shift();
      if (response instanceof Error) {
        throw response;
      }
      if (typeof response === 'function') {
        return response(request);
      }
      return structuredClone(response);
    }
  };
}

// FR-010, FR-014.
function createSleepRecorder() {
  const delays = [];
  return {
    delays,
    // FR-010, FR-014.
    async sleep(milliseconds) {
      delays.push(milliseconds);
    }
  };
}

module.exports = { createFakeAiClient, createSleepRecorder };
