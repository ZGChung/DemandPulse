import { Prisma, PrismaClient } from "@prisma/client";
import cosineSimilarity from "compute-cosine-similarity";
import { kmeans } from "ml-kmeans";

import { prisma } from "@/lib/prisma";

export interface ClusteringOptions {
  maxClusters?: number;
  minClusterSize?: number;
  similarityThreshold?: number;
  maxIterations?: number;
}

export interface ClusterAssignment {
  requirementId: string;
  clusterId: string | null;
  similarity: number;
}

export interface ClusterResult {
  clusterId: string;
  name: string;
  description: string;
  centroid: number[] | null;
  requirementIds: string[];
  requirementCount: number;
}

export class ClusteringService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma!;
  }

  /**
   * Cluster requirements based on their vector embeddings
   */
  async clusterRequirements(
    requirements: Array<{ id: string; embedding: number[] }>,
    options: ClusteringOptions = {}
  ): Promise<ClusterResult[]> {
    const {
      maxClusters = 10,
      minClusterSize = 2,
      similarityThreshold = 0.7,
      maxIterations = 100,
    } = options;

    if (requirements.length < minClusterSize) {
      console.log(`Not enough requirements to cluster: ${requirements.length} < ${minClusterSize}`);
      return [];
    }

    // Filter out requirements without embeddings
    const validRequirements = requirements.filter((r) => r.embedding && r.embedding.length > 0);
    if (validRequirements.length < minClusterSize) {
      console.log(
        `Not enough requirements with embeddings: ${validRequirements.length} < ${minClusterSize}`
      );
      return [];
    }

    const embeddings = validRequirements.map((r) => r.embedding);
    const requirementIds = validRequirements.map((r) => r.id);

    // Determine optimal number of clusters (max of sqrt(n) or maxClusters)
    const maxK = Math.min(
      maxClusters,
      Math.max(2, Math.floor(Math.sqrt(validRequirements.length)))
    );

    try {
      // Perform K-means clustering
      const { clusters, centroids } = this.performKMeans(embeddings, maxK, maxIterations);

      // Create clusters from K-means results
      const clusterResults: ClusterResult[] = [];

      for (let clusterIdx = 0; clusterIdx < centroids.length; clusterIdx++) {
        const clusterRequirementIndices = clusters
          .map((c, idx) => (c === clusterIdx ? idx : -1))
          .filter((idx) => idx !== -1);

        if (clusterRequirementIndices.length >= minClusterSize) {
          const clusterRequirementIds = clusterRequirementIndices.map((idx) => requirementIds[idx]);
          const centroid = centroids[clusterIdx];

          // Create cluster name and description based on centroid similarity
          const clusterName = `Cluster ${clusterIdx + 1}`;
          const clusterDescription = this.generateClusterDescription(
            clusterRequirementIds,
            validRequirements,
            centroid
          );

          clusterResults.push({
            clusterId: `kmeans_${Date.now()}_${clusterIdx}`,
            name: clusterName,
            description: clusterDescription,
            centroid,
            requirementIds: clusterRequirementIds,
            requirementCount: clusterRequirementIds.length,
          });
        }
      }

      // Merge similar clusters based on centroid similarity
      const mergedResults = this.mergeSimilarClusters(clusterResults, similarityThreshold);

      // Save clusters to database
      await this.saveClustersToDatabase(mergedResults);

      // Assign requirements to clusters in database
      await this.assignRequirementsToClusters(mergedResults);

      return mergedResults;
    } catch (error) {
      console.error("Error clustering requirements:", error);
      return [];
    }
  }

  /**
   * Perform K-means clustering on embeddings
   */
  private performKMeans(
    embeddings: number[][],
    k: number,
    maxIterations: number
  ): { clusters: number[]; centroids: number[][] } {
    // Normalize embeddings for better cosine similarity performance
    const normalizedEmbeddings = embeddings.map((embedding) => this.normalizeVector(embedding));

    // Run K-means algorithm
    const result = kmeans(normalizedEmbeddings, k, {
      maxIterations,
      initialization: "kmeans++",
    });

    // De-normalize centroids (they are normalized from normalized embeddings)
    const centroids = result.centroids.map((centroid: number[]) => {
      // ml-kmeans centroids are already in the normalized space
      // We'll keep them normalized for similarity calculations
      return centroid;
    });

    return {
      clusters: result.clusters,
      centroids,
    };
  }

  /**
   * Merge clusters with similar centroids
   */
  private mergeSimilarClusters(
    clusters: ClusterResult[],
    similarityThreshold: number
  ): ClusterResult[] {
    if (clusters.length <= 1) return clusters;

    const merged: ClusterResult[] = [];
    const visited = new Set<number>();

    for (let i = 0; i < clusters.length; i++) {
      if (visited.has(i)) continue;

      visited.add(i);
      const currentCluster = clusters[i];
      const similarClusters: ClusterResult[] = [currentCluster];

      for (let j = i + 1; j < clusters.length; j++) {
        if (visited.has(j)) continue;

        const otherCluster = clusters[j];
        if (
          currentCluster.centroid &&
          otherCluster.centroid &&
          this.cosineSimilarity(currentCluster.centroid, otherCluster.centroid) >=
            similarityThreshold
        ) {
          visited.add(j);
          similarClusters.push(otherCluster);
        }
      }

      if (similarClusters.length === 1) {
        merged.push(currentCluster);
      } else {
        // Merge similar clusters
        const mergedCluster = this.mergeClusters(similarClusters);
        merged.push(mergedCluster);
      }
    }

    return merged;
  }

  /**
   * Merge multiple clusters into one
   */
  private mergeClusters(clusters: ClusterResult[]): ClusterResult {
    const allRequirementIds = clusters.flatMap((c) => c.requirementIds);
    const uniqueRequirementIds = [...new Set(allRequirementIds)];

    // Calculate weighted centroid
    const weightedCentroid = this.calculateWeightedCentroid(
      clusters.filter((c) => c.centroid).map((c) => c.centroid!),
      clusters.map((c) => c.requirementCount)
    );

    // Generate new name and description
    const name = `Merged Cluster (${clusters.length} groups)`;
    const description = `Combined cluster containing ${uniqueRequirementIds.length} requirements from ${clusters.length} similar groups`;

    return {
      clusterId: `merged_${Date.now()}`,
      name,
      description,
      centroid: weightedCentroid,
      requirementIds: uniqueRequirementIds,
      requirementCount: uniqueRequirementIds.length,
    };
  }

  /**
   * Assign a single requirement to the most similar existing cluster
   */
  async assignToCluster(requirement: { id: string; embedding: number[] }): Promise<string | null> {
    if (!requirement.embedding || requirement.embedding.length === 0) {
      return null;
    }

    // Get all existing clusters with centroids
    const existingClusters = await this.prisma.requirementCluster.findMany({
      where: {
        centroidEmbedding: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        centroidEmbedding: true,
      },
    });

    if (existingClusters.length === 0) {
      return null;
    }

    let bestClusterId: string | null = null;
    let bestSimilarity = -1;
    const similarityThreshold = 0.6;

    for (const cluster of existingClusters) {
      if (cluster.centroidEmbedding && typeof cluster.centroidEmbedding === "object") {
        const centroid = cluster.centroidEmbedding as number[];
        const similarity = this.cosineSimilarity(requirement.embedding, centroid);

        if (similarity > bestSimilarity && similarity >= similarityThreshold) {
          bestSimilarity = similarity;
          bestClusterId = cluster.id;
        }
      }
    }

    if (bestClusterId) {
      // Add requirement to cluster
      await this.prisma.requirement.update({
        where: { id: requirement.id },
        data: {
          clusters: {
            connect: { id: bestClusterId },
          },
          status: "CLUSTERED",
        },
      });

      // Update cluster centroid
      await this.updateClusterCentroid(bestClusterId);
    }

    return bestClusterId;
  }

  /**
   * Update cluster centroid based on all its requirements' embeddings
   */
  async updateClusterCentroid(clusterId: string): Promise<void> {
    const cluster = await this.prisma.requirementCluster.findUnique({
      where: { id: clusterId },
      include: {
        requirements: {
          select: {
            embedding: true,
          },
        },
      },
    });

    if (!cluster || cluster.requirements.length === 0) {
      return;
    }

    const embeddings = cluster.requirements
      .map((r) => r.embedding)
      .filter(
        (embedding): embedding is number[] =>
          embedding !== null && Array.isArray(embedding) && embedding.length > 0
      );

    if (embeddings.length === 0) {
      return;
    }

    // Calculate new centroid as mean of embeddings
    const centroid = this.calculateCentroid(embeddings);

    await this.prisma.requirementCluster.update({
      where: { id: clusterId },
      data: {
        centroidEmbedding: centroid,
        requirementCount: cluster.requirements.length,
        lastDetectedAt: new Date(),
      },
    });
  }

  /**
   * Find similar requirements based on vector similarity
   */
  async findSimilarRequirements(
    embedding: number[],
    limit: number = 10
  ): Promise<Array<{ id: string; similarity: number }>> {
    if (!embedding || embedding.length === 0) {
      return [];
    }

    // Get all requirements with embeddings
    const requirements = await this.prisma.requirement.findMany({
      where: {
        embedding: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        embedding: true,
      },
      take: 1000, // Limit for performance
    });

    const similarities: Array<{ id: string; similarity: number }> = [];

    for (const req of requirements) {
      if (req.embedding && Array.isArray(req.embedding)) {
        const similarity = this.cosineSimilarity(embedding, req.embedding as number[]);
        similarities.push({
          id: req.id,
          similarity,
        });
      }
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Return top N
    return similarities.slice(0, limit);
  }

  /**
   * Save clusters to database
   */
  private async saveClustersToDatabase(clusters: ClusterResult[]): Promise<void> {
    for (const cluster of clusters) {
      await this.prisma.requirementCluster.upsert({
        where: { id: cluster.clusterId },
        update: {
          name: cluster.name,
          description: cluster.description,
          centroidEmbedding: cluster.centroid === null ? Prisma.JsonNull : cluster.centroid,
          requirementCount: cluster.requirementCount,
          lastDetectedAt: new Date(),
        },
        create: {
          id: cluster.clusterId,
          name: cluster.name,
          description: cluster.description,
          centroidEmbedding: cluster.centroid === null ? Prisma.JsonNull : cluster.centroid,
          requirementCount: cluster.requirementCount,
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
        },
      });
    }
  }

  /**
   * Assign requirements to clusters in database
   */
  private async assignRequirementsToClusters(clusters: ClusterResult[]): Promise<void> {
    for (const cluster of clusters) {
      for (const requirementId of cluster.requirementIds) {
        await this.prisma.requirement.update({
          where: { id: requirementId },
          data: {
            clusters: {
              connect: { id: cluster.clusterId },
            },
            status: "CLUSTERED",
          },
        });
      }
    }
  }

  /**
   * Generate cluster description based on requirements
   */
  private generateClusterDescription(
    requirementIds: string[],
    _requirements: Array<{ id: string; embedding: number[] }>,
    _centroid: number[] | null
  ): string {
    const count = requirementIds.length;
    if (count === 0) return "Empty cluster";

    return `Cluster of ${count} similar requirements`;
  }

  /**
   * Calculate centroid as mean of embeddings
   */
  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dim = embeddings[0].length;
    const centroid = new Array(dim).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += embedding[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  /**
   * Calculate weighted centroid
   */
  private calculateWeightedCentroid(centroids: number[][], weights: number[]): number[] {
    if (centroids.length === 0) return [];

    const dim = centroids[0].length;
    const weightedCentroid = new Array(dim).fill(0);
    let totalWeight = 0;

    for (let idx = 0; idx < centroids.length; idx++) {
      const centroid = centroids[idx];
      const weight = weights[idx];
      totalWeight += weight;

      for (let i = 0; i < dim; i++) {
        weightedCentroid[i] += centroid[i] * weight;
      }
    }

    for (let i = 0; i < dim; i++) {
      weightedCentroid[i] /= totalWeight;
    }

    return weightedCentroid;
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;

    return vector.map((val) => val / magnitude);
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    try {
      return cosineSimilarity(vecA, vecB) ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Fallback to manual calculation
      if (vecA.length !== vecB.length) {
        return 0;
      }

      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }

      if (normA === 0 || normB === 0) {
        return 0;
      }

      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
  }
}
