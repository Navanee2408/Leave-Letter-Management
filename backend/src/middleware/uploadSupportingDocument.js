import multer from 'multer'
import { MAX_SUPPORTING_DOCUMENT_BYTES } from '../constants/index.js'
import { AppError } from '../utils/AppError.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SUPPORTING_DOCUMENT_BYTES,
    files: 1,
    fields: 10,
    fieldSize: 10 * 1024,
    parts: 12,
  },
})

/**
 * Parse an optional multipart supporting document. JSON requests without a
 * file pass straight through, so the same route supports both shapes.
 */
export function uploadSupportingDocument(req, res, next) {
  upload.single('supportingDocument')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Supporting document must be 5 MB or smaller'
          : 'Invalid supporting document upload'

      next(new AppError(message, 400))
      return
    }

    next(new AppError('Invalid supporting document upload', 400))
  })
}
