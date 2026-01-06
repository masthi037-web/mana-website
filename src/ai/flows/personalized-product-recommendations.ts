'use server';

/**
 * @fileOverview Provides personalized product recommendations based on user browsing history.
 *
 * - getPersonalizedRecommendations - A function to retrieve personalized product recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function, which includes the user's browsing history.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function, containing a list of recommended product names.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { categories } from '@/data/products';

const allProductNames = categories.flatMap(c => c.catalogs.flatMap(ca => ca.products.map(p => p.name)));

const PersonalizedRecommendationsInputSchema = z.object({
  browsingHistory: z.array(z.string()).describe('A list of product names the user has previously viewed.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendedProducts: z.array(z.enum(allProductNames.length > 0 ? [allProductNames[0], ...allProductNames.slice(1)] : [""] as [string, ...string[]])).describe('A list of product names recommended to the user.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  if (allProductNames.length === 0) {
    return { recommendedProducts: [] };
  }
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an e-commerce recommendation engine.
Based on the user's browsing history, recommend 4 products they might be interested in.
Only recommend products from the following list: ${allProductNames.join(', ')}

Browsing History: {{#each browsingHistory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Recommended Products:`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
