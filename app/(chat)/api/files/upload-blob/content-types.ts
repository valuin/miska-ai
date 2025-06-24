export const allowedContentTypes = [
  // Images (EXIF metadata and OCR)
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/bmp',

  // PDF
  'application/pdf',

  // PowerPoint
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

  // Word
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

  // Excel
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

  // Audio (EXIF metadata and speech transcription)
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/x-wav',
  'audio/webm', // .webm (can contain audio)
  'audio/ogg', // .ogg
  'audio/x-m4a', // .m4a
  'audio/aac', // .aac

  // HTML
  'text/html',

  // Text-based formats
  'text/csv', // CSV
  'application/json', // JSON
  'application/xml', // XML
  'text/xml', // XML (alternative MIME type)
  'text/plain', // fallback for some .txt, .csv, .json cases
] as const;
