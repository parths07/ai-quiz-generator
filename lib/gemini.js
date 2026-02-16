import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Gemini API Client for Quiz Generation
 * Uses Google's Generative AI SDK to generate quizzes from text content
 */

// Initialize Gemini client with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Model fallback chain: Try models in order until one works
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',      // Try this first (fastest)
  'gemini-2.5-pro',        // Fallback to pro (more advanced)
  'gemini-2.5-flash'       // Final fallback (stable)
]

/**
 * Generate a quiz from provided content using Gemini AI
 * @param {string} content - Text content to generate quiz from
 * @param {number} numberOfQuestions - Number of questions to generate
 * @param {string} difficulty - Difficulty level: 'easy', 'medium', or 'hard'
 * @returns {Promise<Array>} Array of quiz questions
 */
export async function generateQuiz(
  content,
  numberOfQuestions = 5,
  difficulty = 'medium'
) {
  try {
    // Validate inputs
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required to generate quiz')
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      throw new Error('Number of questions must be between 1 and 20')
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error('Difficulty must be easy, medium, or hard')
    }

    // Create detailed prompt for quiz generation
    const prompt = createQuizPrompt(content, numberOfQuestions, difficulty)

    // Generate quiz with retry logic
    const questions = await generateWithRetry(prompt, 3)

    return questions
  } catch (error) {
    console.error('  Quiz generation error:', error.message)
    throw new Error(`Failed to generate quiz: ${error.message}`)
  }
}

/**
 * Create a detailed prompt for Gemini to generate quiz questions
 * @param {string} content - Text content
 * @param {number} numberOfQuestions - Number of questions
 * @param {string} difficulty - Difficulty level
 * @returns {string} Formatted prompt
 */
function createQuizPrompt(content, numberOfQuestions, difficulty) {
  return `You are an expert quiz creator. Generate ${numberOfQuestions} multiple-choice questions based on the following text content.

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}

CONTENT:
${content}

INSTRUCTIONS:
1. Generate exactly ${numberOfQuestions} questions that test comprehension and key concepts
2. Each question must have exactly 4 options labeled A, B, C, D
3. Only one option should be correct
4. Include a brief explanation for why the correct answer is right
5. Questions should be ${difficulty} difficulty:
   - Easy: Basic recall and understanding
   - Medium: Application and analysis
   - Hard: Synthesis and evaluation
6. Ensure questions are clear, unambiguous, and directly related to the content
7. Avoid trick questions or overly obscure details

REQUIRED JSON FORMAT (respond with ONLY valid JSON, no additional text):
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Generate the quiz now in the exact JSON format specified above.`
}

/**
 * Generate quiz with model fallback and retry logic
 * @param {string} prompt - The prompt to send to Gemini
 * @param {number} maxRetries - Maximum number of retry attempts per model
 * @returns {Promise<Array>} Array of quiz questions
 */
async function generateWithRetry(prompt, maxRetries = 2) {
  let lastError = null

  // Try each model in the fallback chain
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    console.log(`🤖 Trying model: ${modelName}`)
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      
      // Try this model with retries
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Generating quiz with ${modelName} (attempt ${attempt}/${maxRetries})...`)

          // Generate content with Gemini
          const result = await model.generateContent(prompt)
          const response = await result.response
          const text = response.text()

          // Parse the response to valid JSON
          const questions = parseQuizResponse(text)

          console.log(`  Successfully generated ${questions.length} questions using ${modelName}`)
          return questions
        } catch (error) {
          lastError = error
          console.error(`  Attempt ${attempt} with ${modelName} failed:`, error.message)

          // If this is not the last attempt for this model, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = attempt * 1000 // Exponential backoff
            console.log(`⏳ Waiting ${waitTime}ms before retry...`)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
          }
        }
      }
      
      // If we get here, all retries for this model failed
      console.log(`⚠️  Model ${modelName} failed after ${maxRetries} attempts, trying next model...`)
      
    } catch (error) {
      // Model initialization failed, try next model
      console.error(`  Failed to initialize model ${modelName}:`, error.message)
      lastError = error
    }
  }

  // All models and retries failed
  throw new Error(
    `Failed to generate quiz with all models. Last error: ${lastError.message}`
  )
}

/**
 * Parse Gemini's response to extract valid JSON quiz data
 * @param {string} text - Raw response text from Gemini
 * @returns {Array} Array of quiz questions
 */
function parseQuizResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleanedText = text.trim()

    // Remove ```json and ``` markers
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    // Parse JSON
    const data = JSON.parse(cleanedText)

    // Validate structure
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response structure: missing questions array')
    }

    // Validate each question
    data.questions.forEach((q, index) => {
      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Question ${index + 1}: missing or invalid question`)
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1}: must have exactly 4 options`)
      }
      if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
        throw new Error(
          `Question ${index + 1}: missing or invalid correctAnswer`
        )
      }
      if (!q.explanation || typeof q.explanation !== 'string') {
        throw new Error(`Question ${index + 1}: missing or invalid explanation`)
      }
    })

    return data.questions
  } catch (error) {
    console.error('  Failed to parse quiz response:', error.message)
    console.error('Raw response:', text.substring(0, 500))
    throw new Error(`Invalid response format: ${error.message}`)
  }
}

/**
 * Test the Gemini API connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function testConnection() {
  try {
    // Try the first model in the chain
    const model = genAI.getGenerativeModel({ model: MODEL_FALLBACK_CHAIN[0] })
    const result = await model.generateContent('Say "Hello"')
    const response = await result.response
    const text = response.text()
    return text.length > 0
  } catch (error) {
    console.error('  Gemini API connection test failed:', error.message)
    return false
  }
}
