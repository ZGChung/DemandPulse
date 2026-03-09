import { env } from "@/lib/env";
import { ClusteringService } from "@/services/clustering-service";

export interface AIAnalysisResult {
  categories: string[];
  confidence: number;
  embeddings: number[] | null;
  summary: string;
  keywords: string[];
  processingLog: string[];
}

const MINIMAX_EMBED_BASE = "https://api.minimax.chat/v1";

export class AIProcessingService {
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/v1";

  constructor() {
    this.apiKey = env.deepseekApiKey();
    const minimaxKey = env.minimaxApiKey();
    if (!this.apiKey && !minimaxKey) {
      throw new Error(
        "At least one of DEEPSEEK_API_KEY or MINIMAX_API_KEY must be set for AI processing"
      );
    }
  }

  async analyzeRequirement(requirementText: string): Promise<AIAnalysisResult> {
    const processingLog: string[] = [];

    try {
      processingLog.push(
        `Starting AI analysis for requirement: ${requirementText.substring(0, 50)}...`
      );

      // Step 1: Get embeddings for the requirement
      const embeddings = await this.getEmbeddings(requirementText);
      processingLog.push(`Generated embeddings: ${embeddings ? "Success" : "Failed"}`);

      // Step 2: Categorize the requirement
      const categorization = await this.categorizeRequirement(requirementText);
      processingLog.push(
        `Categorized as: ${categorization.categories.join(", ")} with confidence ${categorization.confidence}`
      );

      // Step 3: Extract keywords
      const keywords = await this.extractKeywords(requirementText);
      processingLog.push(`Extracted keywords: ${keywords.join(", ")}`);

      // Step 4: Generate summary
      const summary = await this.generateSummary(requirementText);
      processingLog.push(`Generated summary: ${summary.substring(0, 100)}...`);

      return {
        categories: categorization.categories,
        confidence: categorization.confidence,
        embeddings,
        summary,
        keywords,
        processingLog,
      };
    } catch (error) {
      processingLog.push(
        `AI processing error: ${error instanceof Error ? error.message : "Unknown error"}`
      );

      // Return fallback analysis
      return {
        categories: ["uncategorized"],
        confidence: 0.1,
        embeddings: null,
        summary: requirementText.substring(0, 200),
        keywords: this.extractFallbackKeywords(requirementText),
        processingLog,
      };
    }
  }

  async getEmbeddings(text: string): Promise<number[] | null> {
    const minimaxKey = env.minimaxApiKey();
    if (minimaxKey) {
      return this.getEmbeddingsMiniMax(text, minimaxKey);
    }
    return this.getEmbeddingsDeepSeek(text);
  }

  private async getEmbeddingsMiniMax(text: string, apiKey: string): Promise<number[] | null> {
    try {
      const groupId = env.minimaxGroupId();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };
      if (groupId) headers["Group-Id"] = groupId;

      const body: { model: string; texts: string[]; type: string; group_id?: string } = {
        model: "embo-01",
        texts: [text],
        type: "db",
      };
      if (groupId) body.group_id = groupId;

      const response = await fetch(`${MINIMAX_EMBED_BASE}/embeddings`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`MiniMax embeddings API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const vec = data.vectors?.[0] ?? data.data?.[0]?.embedding ?? null;
      return Array.isArray(vec) ? vec : null;
    } catch (error) {
      console.error("Error getting MiniMax embeddings:", error);
      return null;
    }
  }

  private async getEmbeddingsDeepSeek(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: "deepseek-embedding",
        }),
      });

      if (!response.ok) {
        throw new Error(`Embeddings API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0]?.embedding || null;
    } catch (error) {
      console.error("Error getting embeddings:", error);
      return null;
    }
  }

  async categorizeRequirement(text: string): Promise<{ categories: string[]; confidence: number }> {
    if (!this.apiKey) return { categories: ["other"], confidence: 0.1 };
    try {
      const prompt = `
        Analyze this developer requirement and categorize it. 
        Return ONLY a JSON array with categories and a confidence score.
        
        Requirement: "${text}"
        
        Possible categories: 
        - authentication
        - database
        - api
        - ui_ux
        - devops
        - testing
        - security
        - performance
        - mobile
        - web
        - cli_tool
        - automation
        - data_processing
        - machine_learning
        - other
        
        Format: {"categories": ["category1", "category2"], "confidence": 0.95}
      `;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a requirement categorization assistant. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`Categorization API error: ${response.status}`);
      }

      const data = await response.json();
      const content =
        data.choices[0]?.message?.content || '{"categories": ["other"], "confidence": 0.1}';

      try {
        const result = JSON.parse(content);
        return {
          categories: Array.isArray(result.categories) ? result.categories : ["other"],
          confidence: typeof result.confidence === "number" ? result.confidence : 0.1,
        };
      } catch {
        return { categories: ["other"], confidence: 0.1 };
      }
    } catch (error) {
      console.error("Error categorizing requirement:", error);
      return { categories: ["other"], confidence: 0.1 };
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    if (!this.apiKey) return this.extractFallbackKeywords(text);
    try {
      const prompt = `
        Extract the most important keywords from this developer requirement.
        Return ONLY a JSON array of keywords.
        
        Requirement: "${text}"
        
        Format: ["keyword1", "keyword2", "keyword3"]
      `;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a keyword extraction assistant. Return ONLY valid JSON array.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Keyword extraction API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "[]";

      try {
        const keywords = JSON.parse(content);
        return Array.isArray(keywords) ? keywords : [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error("Error extracting keywords:", error);
      return this.extractFallbackKeywords(text);
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.apiKey) return text.substring(0, 200);
    try {
      const prompt = `
        Summarize this developer requirement in one concise sentence.
        Focus on the core need or problem being solved.
        
        Requirement: "${text}"
        
        Return ONLY the summary text.
      `;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are a requirement summarization assistant. Return ONLY the summary text.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Summary API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || text.substring(0, 200);
    } catch (error) {
      console.error("Error generating summary:", error);
      return text.substring(0, 200);
    }
  }

  async clusterRequirements(
    requirements: Array<{ id: string; text: string; embeddings?: number[] }>,
    maxClusters = 10
  ): Promise<
    Array<{
      clusterId: string;
      name: string;
      description: string;
      requirementIds: string[];
      centroid: number[] | null;
    }>
  > {
    try {
      // Use vector embeddings for clustering via ClusteringService
      const clusteringService = new ClusteringService();

      // Prepare requirements with embeddings
      const requirementsWithEmbeddings = requirements
        .filter((req) => req.embeddings && req.embeddings.length > 0)
        .map((req) => ({
          id: req.id,
          embedding: req.embeddings!,
        }));

      if (requirementsWithEmbeddings.length === 0) {
        console.warn(
          "No embeddings available for clustering, falling back to keyword-based clustering"
        );
        // Fallback to original keyword-based clustering
        return await this.keywordBasedClustering(requirements, maxClusters);
      }

      // Perform vector clustering
      const clusterResults = await clusteringService.clusterRequirements(
        requirementsWithEmbeddings,
        {
          maxClusters,
          minClusterSize: 2,
          similarityThreshold: 0.7,
          maxIterations: 100,
        }
      );

      // Map to expected return format
      return clusterResults.map((cluster) => ({
        clusterId: cluster.clusterId,
        name: cluster.name,
        description: cluster.description,
        requirementIds: cluster.requirementIds,
        centroid: cluster.centroid,
      }));
    } catch (error) {
      console.error("Error clustering requirements:", error);
      // Fallback to keyword-based clustering on error
      try {
        return await this.keywordBasedClustering(requirements, maxClusters);
      } catch (fallbackError) {
        console.error("Fallback clustering also failed:", fallbackError);
        return [];
      }
    }
  }

  /**
   * Original keyword-based clustering implementation (fallback)
   */
  private async keywordBasedClustering(
    requirements: Array<{ id: string; text: string; embeddings?: number[] }>,
    maxClusters: number
  ): Promise<
    Array<{
      clusterId: string;
      name: string;
      description: string;
      requirementIds: string[];
      centroid: number[] | null;
    }>
  > {
    const clusters: Array<{
      clusterId: string;
      name: string;
      description: string;
      requirementIds: string[];
      centroid: number[] | null;
    }> = [];

    // Group by primary category (simplified clustering)
    const categorizedRequirements: Record<string, Array<{ id: string; text: string }>> = {};

    for (const req of requirements) {
      const analysis = await this.analyzeRequirement(req.text);
      const primaryCategory = analysis.categories[0] || "other";

      if (!categorizedRequirements[primaryCategory]) {
        categorizedRequirements[primaryCategory] = [];
      }

      categorizedRequirements[primaryCategory].push({ id: req.id, text: req.text });
    }

    // Create clusters from categories
    for (const [category, reqs] of Object.entries(categorizedRequirements)) {
      if (reqs.length > 0) {
        clusters.push({
          clusterId: `cluster_${category}_${Date.now()}`,
          name: this.formatCategoryName(category),
          description: `${reqs.length} requirements about ${category}`,
          requirementIds: reqs.map((r) => r.id),
          centroid: null,
        });
      }
    }

    // Limit number of clusters
    return clusters.slice(0, maxClusters);
  }

  private extractFallbackKeywords(text: string): string[] {
    // Simple keyword extraction as fallback
    const commonKeywords = [
      "api",
      "database",
      "ui",
      "ux",
      "login",
      "auth",
      "security",
      "performance",
      "mobile",
      "web",
      "automation",
      "tool",
      "script",
      "workflow",
      "data",
      "analysis",
      "report",
      "dashboard",
      "notification",
    ];

    const words = text.toLowerCase().split(/\s+/);
    const keywords = new Set<string>();

    for (const keyword of commonKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        keywords.add(keyword);
      }
    }

    // Add some frequent words
    const wordFrequency = new Map<string, number>();
    for (const word of words) {
      if (word.length > 3) {
        // Ignore short words
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    // Add top 5 frequent words
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    sortedWords.forEach((word) => keywords.add(word));

    return Array.from(keywords);
  }

  private formatCategoryName(category: string): string {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("AI service connection test failed:", error);
      return false;
    }
  }
}
