// Mock for ml-kmeans module
function kmeans(data, k, options) {
  // Simple mock implementation that assigns points to random clusters
  const clusters = new Array(data.length).fill(0).map(() => Math.floor(Math.random() * k));

  // Mock centroids as random vectors
  const centroids = [];
  for (let i = 0; i < k; i++) {
    if (data[0]) {
      centroids.push(new Array(data[0].length).fill(0).map(() => Math.random()));
    }
  }

  return {
    clusters,
    centroids,
    iterations: options?.maxIterations || 10,
  };
}

module.exports = { kmeans };
