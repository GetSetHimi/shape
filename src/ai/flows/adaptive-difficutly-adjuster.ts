// src/ai/flows/adaptive-difficulty-adjuster.ts
'use server';
/**
 * @fileOverview Adjusts game difficulty based on player performance using an LLM.
 *
 * - adjustDifficulty - A function that adjusts the game difficulty.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  successRate: z
    .number()
    .describe('The player success rate (0 to 1).'),
  speed: z
    .number()
    .describe('The player average speed (e.g., time per level).'),
  errorPatterns: z
    .string()
    .describe('Description of the player common error patterns.'),
  currentDifficulty: z
    .string()
    .describe('The current difficulty level.'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  suggestedDifficulty: z
    .string()
    .describe('The suggested difficulty level based on performance.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the difficulty adjustment.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an expert game designer, skilled at adjusting game difficulty to match player skill.

  Based on the player's performance, suggest a new difficulty level and explain your reasoning.

  Player Success Rate: {{{successRate}}}
  Player Average Speed: {{{speed}}}
  Player Error Patterns: {{{errorPatterns}}}
  Current Difficulty: {{{currentDifficulty}}}

  Consider the following difficulty levels: Very Easy, Easy, Normal, Hard, Very Hard
  Respond with a JSON object containing the suggested difficulty and your reasoning.
  `,
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustDifficultyPrompt(input);
    return output!;
  }
);
