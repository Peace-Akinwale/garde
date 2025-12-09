import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { anthropic } from '../index.js';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

/**
 * Fetch and parse article from URL
 */
export async function fetchArticle(url) {
  try {
    console.log(`📰 Fetching article from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      timeout: 30000, // 30 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't throw on 4xx errors, we'll handle them
      },
    });

    // Handle specific status codes
    if (response.status === 403) {
      throw new Error('Website blocked our request (403 Forbidden). This website may not allow automated access. Try copying the article content manually or use a different source.');
    }

    if (response.status === 404) {
      throw new Error('Article not found (404). Please check the URL and try again.');
    }

    if (response.status >= 400) {
      throw new Error(`Failed to fetch article (HTTP ${response.status})`);
    }

    const contentType = response.headers['content-type'] || '';

    // Handle PDF
    if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
      return await parsePDF(response.data);
    }

    // Handle HTML
    if (contentType.includes('html') || contentType.includes('text')) {
      return parseHTML(response.data, url);
    }

    throw new Error(`Unsupported content type: ${contentType}`);
  } catch (error) {
    console.error('Error fetching article:', error);
    throw new Error(`Failed to fetch article: ${error.message}`);
  }
}

/**
 * Parse HTML content and extract main article text
 */
function parseHTML(html, url) {
  try {
    console.log('📝 Parsing HTML content...');
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .comments, .social-share').remove();

    // Try to find the main article content
    // Common article containers
    const selectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      'main',
      '#content',
    ];

    let articleContent = '';
    let title = '';

    // Extract title
    title = $('h1').first().text().trim() ||
            $('title').text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            'Untitled Article';

    // Try to find main content
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        articleContent = element.html();
        break;
      }
    }

    // Fallback: get body content if no article found
    if (!articleContent) {
      articleContent = $('body').html();
    }

    // Convert HTML to markdown for better Claude processing
    const markdown = turndownService.turndown(articleContent);

    console.log(`✅ Extracted article: ${title.substring(0, 50)}...`);
    console.log(`📏 Content length: ${markdown.length} characters`);

    return {
      title,
      content: markdown,
      url,
      contentType: 'html',
    };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    throw new Error(`Failed to parse HTML: ${error.message}`);
  }
}

/**
 * Parse PDF content
 */
async function parsePDF(buffer) {
  try {
    console.log('📄 Parsing PDF content...');
    const data = await pdfParse(buffer);

    return {
      title: data.info?.Title || 'PDF Article',
      content: data.text,
      contentType: 'pdf',
      metadata: {
        pages: data.numpages,
        author: data.info?.Author,
      },
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract guide/recipe from article using Claude
 */
export async function extractGuideFromArticle(articleData) {
  try {
    console.log('🤖 Extracting guide using Claude...');

    const { title, content, url } = articleData;

    // Truncate content if too long (Claude has token limits)
    const maxLength = 50000; // ~12k tokens
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n\n[Content truncated...]'
      : content;

    const prompt = `You are an expert at extracting structured recipes and how-to guides from articles.

Article Title: ${title}
Article Content:
${truncatedContent}

Extract the following information and return it as a JSON object:

{
  "title": "The title of the recipe/guide",
  "type": "recipe" or "craft" or "howto" or "other",
  "category": "A specific category (e.g., 'cooking', 'beauty', 'crafts', 'technology', 'home-improvement')",
  "language": "Detected language (e.g., 'english', 'yoruba', 'spanish')",
  "ingredients": [
    "ingredient 1 with quantity",
    "ingredient 2 with quantity"
  ],
  "steps": [
    "Step 1 detailed instruction",
    "Step 2 detailed instruction"
  ],
  "duration": "Estimated time (e.g., '30 minutes', '2 hours')",
  "servings": "Number of servings or amount produced (if applicable)",
  "difficulty": "easy" or "medium" or "hard",
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "summary": "A brief 2-3 sentence summary of what this guide is about"
}

Important rules:
1. For "type" field, use ONLY these values:
   - "recipe" for cooking/food recipes
   - "craft" for DIY crafts, handmade projects, making physical items
   - "howto" for tutorials, how-to guides, instructions
   - "other" for anything that doesn't fit above categories
2. Extract ALL ingredients/materials mentioned
3. Extract ALL steps in order
4. Be detailed and specific
5. If servings don't apply (like DIY projects), use amount produced (e.g., "1 bar of soap", "Makes 6 items")
6. Include any warnings or important notes in the tips
7. If the article is in a language other than English, detect it and set the "language" field
8. Return ONLY the JSON object, no other text

JSON:`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent extraction
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const extractedText = response.content[0].text;

    // Parse the JSON response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract valid JSON from Claude response');
    }

    const guide = JSON.parse(jsonMatch[0]);

    console.log(`✅ Extracted guide: ${guide.title}`);
    console.log(`   Type: ${guide.type} | Category: ${guide.category}`);
    console.log(`   Ingredients: ${guide.ingredients?.length || 0} | Steps: ${guide.steps?.length || 0}`);

    return {
      guide,
      sourceUrl: url,
      articleContent: truncatedContent,
    };
  } catch (error) {
    console.error('Error extracting guide from article:', error);
    throw new Error(`Failed to extract guide: ${error.message}`);
  }
}

/**
 * Main function: Process article from URL
 */
export async function processArticle(url, userId) {
  try {
    console.log(`\n📰 ========== PROCESSING ARTICLE ==========`);
    console.log(`🔗 URL: ${url}`);
    console.log(`👤 User: ${userId}`);

    // Step 1: Fetch and parse article
    const articleData = await fetchArticle(url);

    // Step 2: Extract guide using Claude
    const result = await extractGuideFromArticle(articleData);

    console.log(`✅ Article processing complete!`);
    console.log(`========================================\n`);

    return result;
  } catch (error) {
    console.error('❌ Article processing failed:', error);
    throw error;
  }
}
