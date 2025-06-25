export async function getAttachmentText(file: {
  url?: string;
  name?: string;
  contentType?: string;
}): Promise<string> {
  if (file.contentType?.startsWith('image/')) return '';

  if (!file.url || !file.name) {
    console.warn('File missing URL or name for text extraction');
    return '';
  }

  if (file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)) {
    return '';
  }

  try {
    const response = await fetch(
      'https://markitdown.up.railway.app/convert-url',
      {
        method: 'POST',
        body: JSON.stringify({ url: file.url, name: file.name }),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      console.warn(`Failed to extract text from ${file.name}:`, response.statusText);
      return '';
    }

    const data = await response.json();
    return data.result || '';
  } catch (error) {
    console.warn(`Error extracting text from ${file.name}:`, error);
    return '';
  }
}