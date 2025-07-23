import { useState } from 'react';
import { useWorkflow } from '../use-workflow';
import { parseDataStreamPart } from 'ai';

export const useWorkflowGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const initializeWorkflow = useWorkflow((state) => state.initializeWorkflow);

  const generateWorkflow = async (prompt: string, file?: File) => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      let body: BodyInit = JSON.stringify({ prompt });

      if (file) {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("file", file);
        body = formData;
        // When sending FormData, do not set Content-Type header manually,
        // the browser will set it automatically with the correct boundary.
        delete headers['Content-Type'];
      }

      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let fullSchema = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processStream = async ({
        done,
        value,
      }: ReadableStreamReadResult<Uint8Array>) => {
        if (done) {
          console.log('Stream complete');
          try {
            const finalSchema = JSON.parse(fullSchema);
            if (finalSchema && finalSchema.schema && finalSchema.schema.nodes && finalSchema.schema.edges) {
              initializeWorkflow(finalSchema.schema.nodes, finalSchema.schema.edges);
              console.log("Workflow initialized with nodes:", finalSchema.schema.nodes, "and edges:", finalSchema.schema.edges);
            } else {
              throw new Error("Invalid workflow schema received.");
            }
          } catch (parseError) {
            console.error("Failed to parse final schema:", parseError);
            setGenerationError("Failed to parse workflow schema.");
          }
          setIsGenerating(false);
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        const parts = chunk.split('\n').filter(Boolean);

        for (const part of parts) {
          try {
            const parsed = parseDataStreamPart(part);
            switch (parsed.type) {
              case 'message_annotations':
                for (const annotation of parsed.value) {
                  if (
                    annotation &&
                    typeof annotation === 'object' &&
                    'type' in annotation &&
                    (annotation as any).type === 'progress' &&
                    'message' in annotation &&
                    typeof (annotation as any).message === 'string' &&
                    'progress' in annotation &&
                    typeof (annotation as any).progress === 'number'
                  ) {
                    setGenerationMessage((annotation as any).message);
                    setGenerationProgress((annotation as any).progress);
                  }
                }
                break;
              case 'data':
                for (const data of parsed.value) {
                  if (
                    data &&
                    typeof data === 'object' &&
                    'type' in data &&
                    (data as any).type === 'schema_chunk' &&
                    'chunk' in data &&
                    typeof (data as any).chunk === 'string'
                  ) {
                    fullSchema += (data as any).chunk;
                  }
                }
                break;
            }
          } catch (error) {
            console.error('Error parsing stream part:', error);
            setGenerationError('Error processing workflow generation stream.');
          }
        }

        reader.read().then(processStream).catch((error) => {
          console.error('Stream reading error:', error);
          setGenerationError('Error reading workflow generation stream.');
          setIsGenerating(false);
        });
      };

      reader.read().then(processStream).catch((error) => {
        console.error('Initial stream reading error:', error);
        setGenerationError('Failed to start workflow generation stream.');
        setIsGenerating(false);
      });
    } catch (error: any) {
      console.error('Error generating workflow:', error);
      setGenerationError(error.message || 'Failed to generate workflow.');
      setIsGenerating(false);
    }
  };

  return { generateWorkflow, isGenerating, generationError, generationProgress, generationMessage };
};