import { z } from "zod";

export const startCycleSchema = z.object({
  startDate: z.coerce.date().optional(),
});
