import mongoose from 'mongoose'

/**
 * Book Schema
 * Represents a PDF book uploaded to the system
 * Stores metadata and extracted text content
 */
const BookSchema = new mongoose.Schema(
  {
    // Basic book information
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },

    // File information
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    totalPages: {
      type: Number,
      min: 0,
    },
    fileSize: {
      type: Number, // Size in bytes
      min: 0,
    },

    // GridFS storage reference
    pdfFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'PDF file reference is required'],
    },

    // Per-page text storage for quiz generation
    pages: [
      {
        pageNumber: {
          type: Number,
          required: true,
          min: 1,
        },
        text: {
          type: String,
          default: '', // Allow empty string for blank pages
        },
        characterCount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Legacy field - kept for backward compatibility
    pdfText: {
      type: String, // Full extracted text from PDF (deprecated)
    },

    // Chapter organization
    chapters: [
      {
        chapterName: {
          type: String,
          required: true,
        },
        startPage: {
          type: Number,
          required: true,
          min: 1,
        },
        endPage: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
)

// Indexes for better query performance
BookSchema.index({ title: 1 })
BookSchema.index({ uploadDate: -1 })
BookSchema.index({ pdfFileId: 1 })
BookSchema.index({ 'pages.pageNumber': 1 })

// Virtual field for total character count across all pages
BookSchema.virtual('totalCharacterCount').get(function () {
  if (!this.pages || this.pages.length === 0) {
    return 0
  }
  return this.pages.reduce((total, page) => total + (page.characterCount || 0), 0)
})

// Export the model, or use existing one if already compiled
export default mongoose.models.Book || mongoose.model('Book', BookSchema)
