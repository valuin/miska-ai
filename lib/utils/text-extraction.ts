export async function getAttachmentText(file: {
  url?: string;
  name?: string;
  contentType?: string;
}): Promise<string> {
  if (file.contentType?.startsWith('image/')) return '';

  if (!file.url || !file.name) {
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
      return '';
    }

    const data = await response.json();
    return data.result || '';
  } catch (error) {
    return '';
  }
}
