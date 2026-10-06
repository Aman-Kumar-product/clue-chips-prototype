import { pipeline, env } from '@xenova/transformers';
import photoEmbeddings from '../data/photo_embeddings.json';
import photoSearchText from '../data/photo_search_text.json';

// Skip local model caching issues in some browser environments
env.allowLocalModels = false;

let extractorPipeline = null;

// Initialize the local embedding model
async function getExtractor() {
  if (!extractorPipeline) {
    console.log("Loading Transformers.js model...");
    extractorPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractorPipeline;
}

// Math function to compare two embeddings
function cosineSimilarity(vecA, vecB) {
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

export async function getQueryEmbedding(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function parseIntentWithGroq(query, apiKey) {
  if (!apiKey) {
    console.warn("No Groq API key provided. Skipping intent parsing.");
    return null;
  }
  
  const prompt = `You are a search intent parser for a photo gallery.
The user searched for: "${query}"
Extract the intent into JSON exactly like this (use null if not mentioned):
{
  "place": "place mentioned or null",
  "people": ["name1", "name2"],
  "scene": "scene or mood like night, winter, raining or null",
  "event": "event mentioned or null"
}
Output only raw JSON.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      })
    });
    
    if (!res.ok) throw new Error("Groq API returned an error: " + res.status);
    
    const data = await res.json();
    const content = data.choices[0].message.content.trim();
    
    let jsonStr = content;
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7, -3);
    else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3, -3);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Groq parsing error:", error);
    return null;
  }
}

export async function rankPhotos(queryEmbedding, intentData, allPhotos, activeChips = []) {
  const ranked = allPhotos.map(photo => {
    const photoEmb = photoEmbeddings[photo.id];
    let score = 0;
    
    // Base Semantic Score (Cosine similarity 0 to 1)
    if (photoEmb) {
      score = cosineSimilarity(queryEmbedding, photoEmb);
    }
    
    // AGGRESSIVE INTENT BOOST: If Groq found a matching facet in the query, guarantee it goes to the top
    if (intentData) {
      if (intentData.place && photo.place.toLowerCase().includes(intentData.place.toLowerCase())) {
         score += 2.0; 
      }
      if (intentData.people && intentData.people.length > 0) {
         intentData.people.forEach(person => {
           if (photo.people.map(p=>p.toLowerCase()).includes(person.toLowerCase())) score += 2.0;
         });
      }
      if (intentData.event && photo.event.toLowerCase().includes(intentData.event.toLowerCase())) {
         score += 2.0;
      }
    }

    const semanticAndIntentScore = score;
    let chipScore = 0;

    // CHIP DUAL-FILTER LOGIC
    let passesHardFilter = true;
    
    if (activeChips.length > 0) {
      activeChips.forEach(chip => {
        let matchesThisChip = false;
        if (chip.type === 'people' && photo.people.includes(chip.value)) matchesThisChip = true;
        if (chip.type === 'place' && photo.place === chip.value) matchesThisChip = true;
        if (chip.type === 'event' && photo.event === chip.value) matchesThisChip = true;
        if (chip.type === 'custom') {
          const customVal = chip.value.toLowerCase();
          const desc = (photoSearchText[photo.id] || "").toLowerCase();
          const metaText = `${photo.place || ''} ${photo.event || ''} ${(photo.people || []).join(' ')}`.toLowerCase();
          if (desc.includes(customVal) || metaText.includes(customVal)) matchesThisChip = true;
        }
        
        if (matchesThisChip) {
          chipScore += 1.0; // Soft boost for matching this specific chip
        } else {
          passesHardFilter = false; // Fails the hard filter if it doesn't match ALL chips
        }
      });
    }

    score = semanticAndIntentScore + chipScore;
    return { ...photo, score, semanticAndIntentScore, passesHardFilter };
  });
  
  // Sort descending by score
  return ranked.sort((a, b) => b.score - a.score);
}

// Phase 3: The Clue Engine Facet Discovery
export function generateClueChips(relevantPhotos) {
  if (!relevantPhotos || relevantPhotos.length === 0) return [];
  
  const facetCounts = {}; 
  
  relevantPhotos.forEach(photo => {
    if (photo.place) {
      const key = `place:${photo.place}`;
      facetCounts[key] = (facetCounts[key] || 0) + 1;
    }
    if (photo.event) {
      const key = `event:${photo.event}`;
      facetCounts[key] = (facetCounts[key] || 0) + 1;
    }
    if (photo.people && photo.people.length > 0) {
      photo.people.forEach(person => {
        const key = `people:${person}`;
        facetCounts[key] = (facetCounts[key] || 0) + 1;
      });
    }
  });
  
  // Filter out chips that don't exist, or chips that apply to 100% of the photos (since they don't narrow the search)
  let chips = Object.keys(facetCounts).map(key => {
    const [type, value] = key.split(':');
    return { type, value, count: facetCounts[key], key };
  }).filter(chip => chip.count > 0 && chip.count < relevantPhotos.length && chip.value.trim() !== "");
  
  // Sort by count descending
  chips.sort((a, b) => b.count - a.count);
  
  // Return top 6 chips
  return chips.slice(0, 6);
}
