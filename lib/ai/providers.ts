import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  BASE_MODEL,
  LARGE_MODEL,
  TINY_MODEL,
  isTestEnvironment,
} from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai(BASE_MODEL),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai(LARGE_MODEL),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai(TINY_MODEL),
        'artifact-model': openai(LARGE_MODEL),
      },
      imageModels: {
        'small-model': openai.image(TINY_MODEL),
      },
    });
