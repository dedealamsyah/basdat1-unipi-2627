import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pertemuanCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pertemuan" }),
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
    order: z.number()
  })
});

export const collections = {
  'pertemuan': pertemuanCollection
};
