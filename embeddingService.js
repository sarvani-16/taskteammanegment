// Semantic keywords map to distinct 128-dimensional vectors
const DIMENSIONS = 128;

// Deterministic random number generator based on a seed string
function seedRandom(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return function() {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };
}

// Generate a normalized random vector of given size
function generateRandomVector(seedText) {
    const rand = seedRandom(seedText);
    const vec = new Array(DIMENSIONS);
    let sumSq = 0;
    
    for (let i = 0; i < DIMENSIONS; i++) {
        vec[i] = rand() * 2 - 1; // Values between -1 and 1
        sumSq += vec[i] * vec[i];
    }
    
    // Normalize vector
    const norm = Math.sqrt(sumSq);
    for (let i = 0; i < DIMENSIONS; i++) {
        vec[i] /= norm;
    }
    
    return vec;
}

// Define specific vectors for our core semantic terms
const SEMANTIC_KEYWORDS = {
    "backend": generateRandomVector("backend"),
    "api": generateRandomVector("backend"),
    "server": generateRandomVector("backend"),
    "database": generateRandomVector("backend"),
    "postgres": generateRandomVector("backend"),
    "sql": generateRandomVector("backend"),
    "node": generateRandomVector("backend"),
    "python": generateRandomVector("backend"),
    "java": generateRandomVector("backend"),
    "spring": generateRandomVector("backend"),
    
    "frontend": generateRandomVector("frontend"),
    "ui": generateRandomVector("frontend"),
    "ux": generateRandomVector("frontend"),
    "design": generateRandomVector("frontend"),
    "css": generateRandomVector("frontend"),
    "react": generateRandomVector("frontend"),
    "angular": generateRandomVector("frontend"),
    "vue": generateRandomVector("frontend"),
    "javascript": generateRandomVector("frontend"),
    "html": generateRandomVector("frontend"),
    
    "bug": generateRandomVector("bug"),
    "error": generateRandomVector("bug"),
    "fix": generateRandomVector("bug"),
    
    "testing": generateRandomVector("testing"),
    "test": generateRandomVector("testing"),
    "qa": generateRandomVector("testing"),
    
    "pending": generateRandomVector("pending"),
    "assigned": generateRandomVector("pending"),
    "incomplete": generateRandomVector("pending")
};

// Generates a 128-dimensional embedding from text
export function getEmbedding(text) {
    if (!text || text.trim() === "") {
        return new Array(DIMENSIONS).fill(0);
    }

    const words = text.toLowerCase().split(/\W+/);
    let combinedVec = new Array(DIMENSIONS).fill(0);
    let matchedCount = 0;

    words.forEach(word => {
        if (SEMANTIC_KEYWORDS[word]) {
            const wordVec = SEMANTIC_KEYWORDS[word];
            for (let i = 0; i < DIMENSIONS; i++) {
                combinedVec[i] += wordVec[i];
            }
            matchedCount++;
        }
    });

    // If no predefined keywords matched, generate a stable vector based on text hash
    if (matchedCount === 0) {
        return generateRandomVector(text);
    }

    // Normalize combined vector
    let sumSq = 0;
    for (let i = 0; i < DIMENSIONS; i++) {
        sumSq += combinedVec[i] * combinedVec[i];
    }
    const norm = Math.sqrt(sumSq);
    
    for (let i = 0; i < DIMENSIONS; i++) {
        combinedVec[i] /= norm;
    }

    return combinedVec;
}

// Calculate Cosine Similarity between two vectors
export function getCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
