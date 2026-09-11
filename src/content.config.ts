import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const pertemuanCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/pertemuan" }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    subtitle: z.string().optional(),
    locked: z.boolean().default(true),
    meta: z.object({
      subCPMK: z.string(),
      alokasi: z.string(),
      bobot: z.string(),
      cpmk: z.string()
    }).optional(),
    kuis: z.object({
      latihan: z.number().optional(),
      evaluasi: z.number().optional()
    }).optional(),
    order: z.number()
  })
});

export const collections = {
  'pertemuan': pertemuanCollection
};
