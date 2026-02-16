import mongoose from 'mongoose'

/**
 * Quiz Schema
 * Represents a quiz generated from a book's content
 * Contains questions, answers, and metadata
 */
const QuizSchema = new mongoose.Schema(
  {
    // Reference to the source book
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },

    // Quiz metadata
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },

    // Page range from the book
    pageRange: {
      start: {
        type: Number,
        required: true,
        min: 1,
      },
      end: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    // Quiz questions
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function (arr) {
              return arr.length >= 2 // At least 2 options
            },
            message: 'At least 2 options are required',
          },
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        explanation: {
          type: String,
        },
      },
    ],

    // Quiz configuration
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: '{VALUE} is not a valid difficulty level',
      },
      default: 'medium',
    },
    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    // Caching fields for intelligent quiz reuse
    cacheKey: {
      type: String,
      required: true,
      unique: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String,
      enum: ['gemini', 'cache'],
      default: 'gemini',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
)

// Indexes for better query performance
QuizSchema.index({ bookId: 1 })
QuizSchema.index({ generatedDate: -1 })
QuizSchema.index({ difficulty: 1 })
QuizSchema.index({ cacheKey: 1 }, { unique: true })

// Compound index for cache lookups
QuizSchema.index({
  bookId: 1,
  'pageRange.start': 1,
  'pageRange.end': 1,
  difficulty: 1,
  numberOfQuestions: 1,
})

// Method to increment usage count
QuizSchema.methods.incrementUsage = async function () {
  this.usageCount += 1
  this.lastUsedAt = new Date()
  await this.save()
  return this
}

// Virtual to check if page range is valid
QuizSchema.virtual('isValidPageRange').get(function () {
  return this.pageRange.end >= this.pageRange.start
})

// Export the model, or use existing one if already compiled
export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema)
