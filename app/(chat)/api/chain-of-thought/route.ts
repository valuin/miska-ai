import { NextRequest, NextResponse } from 'next/server';
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { BASE_MODEL } from '@/lib/constants';

const chainOfThoughtAgent = new Agent({
  name: 'Chain of Thought Agent',
  instructions: `You are a helpful AI assistant that thinks step by step.
  Your task is to break down complex questions into a clear reasoning process.
  Always provide your thought process in a structured manner.`,
  model: openai(BASE_MODEL),
});

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question) {
    return NextResponse.json({ message: 'Question is required' }, { status: 400 });
  }

  try {
    const chainOfThoughtPrompt = `
Please think through this question step by step. Show your reasoning process clearly.

Question: ${question}

Please structure your response as follows:
1. Understanding the problem
2. Breaking down the approach
3. Step-by-step reasoning
4. Final answer

Think carefully and show your work:
`;

    const chainOfThoughtResponse = await chainOfThoughtAgent.generate(chainOfThoughtPrompt);

    // Step 2: Extract final answer (optional refinement step)
    const finalAnswerPrompt = `
Based on the following chain of thought reasoning, provide a clear and concise final answer:

Chain of Thought:
${chainOfThoughtResponse.text}

Original Question: ${question}

Please provide only the final answer without repeating the reasoning:
`;

    const finalAnswerResponse = await chainOfThoughtAgent.generate(finalAnswerPrompt);

    return NextResponse.json({
      question,
      chainOfThought: chainOfThoughtResponse.text,
      finalAnswer: finalAnswerResponse.text,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in chain of thought:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}