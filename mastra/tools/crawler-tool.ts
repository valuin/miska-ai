import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const crawlerTool = createTool({
  id: 'crawler',
  description: 'Crawl web pages using crawl4ai and return extracted content.',
  inputSchema: z.object({
    urls: z.array(z.string().url()).describe('List of URLs to crawl.'),
    browser_config: z
      .record(z.any())
      .optional()
      .describe('Browser config object.'),
  }),
  outputSchema: z.object({
    crawled: z.array(
      z.object({
        url: z.string(),
        markdown: z.string().optional(),
        html: z.string().optional(),
        status: z.string().optional(),
        success: z.boolean().optional(),
        error_message: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    ),
  }),
  execute: async (context) => {
    const urls =
      (context as any).urls ??
      (context as any).input?.urls ??
      (context as any).context?.urls ??
      [];
    const crawler_config = { stream: true, cache_mode: 'BYPASS' };
    console.log('CrawlerTool context:', context);
    const response = await fetch(
      'https://crawl4ai-production-805f.up.railway.app/crawl',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          browser_config: {
            type: 'BrowserConfig',
            params: {
              headers: {
                type: 'dict',
                value: {
                  'sec-ch-ua':
                    '"Chromium";v="116", "Not_A Brand";v="8", "Google Chrome";v="116"',
                },
              },
              extra_args: ['--no-sandbox', '--disable-gpu'],
            },
          },
          crawler_config,
        }),
      },
    );
    let data: any = null;
    let error_message = '';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        error_message = `HTTP ${response.status}: ${await response.text()}`;
      } else if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        error_message = await response.text();
      }
    } catch (err: any) {
      error_message = err?.message || 'Unknown error';
    }
    const result = {
      crawled: Array.isArray(data?.results)
        ? data.results.map((r: any) =>
            r
              ? {
                  url: r.url ?? '',
                  markdown:
                    typeof r.markdown_with_citations === 'string'
                      ? r.markdown_with_citations
                          .replace(/(\r?\n)+/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim()
                      : '',
                  html: r.html ?? '',
                  status: r.status ?? '',
                  success: r.success ?? false,
                  error_message: r.error_message ?? '',
                  metadata: r.metadata ?? {},
                }
              : {
                  url: '',
                  markdown: '',
                  html: '',
                  status: '',
                  success: false,
                  error_message: error_message || 'No result returned',
                  metadata: {},
                },
          )
        : urls.map((url: string) => ({
            url,
            markdown: '',
            html: '',
            status: '',
            success: false,
            error_message: error_message || 'No result returned',
            metadata: {},
          })),
    };
    console.log('CrawlerTool returning:', JSON.stringify(result, null, 2));
    return result;
  },
});
