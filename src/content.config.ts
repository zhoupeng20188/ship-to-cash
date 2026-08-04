import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIES = ['deploy', 'payments', 'monetize', 'legal', 'tools'] as const;
export type Category = (typeof CATEGORIES)[number];

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(CATEGORIES),
    difficulty: z.enum(['beginner', 'intermediate']),
    author: z.string().default("Peng Zhou"),
    draft: z.boolean().default(false),
    image: z.string().optional(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .default([]),
  }),
});

export const collections = { blog };
