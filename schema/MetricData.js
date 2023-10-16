const z = require("zod");

const validatePositiveFloat = (value, fieldName) => {
  if (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
    return true;
  }
  throw new Error(`${fieldName} must be a positive float`);
};

const MetricData = z.object({
  rank: z.string().refine((value) => {
    if (/^\d+$/.test(value) && parseInt(value) > 0) {
      return true;
    }
    throw new Error("Rank must be a positive integer");
  }),
  country: z.string(),
  Score: z.string().refine((value) => validatePositiveFloat(value, "Score")),
  "GDP per capita": z
    .string()
    .refine((value) => validatePositiveFloat(value, "GDP per capita")),
  "Social support": z
    .string()
    .refine((value) => validatePositiveFloat(value, "Social support")),
  "Healthy life expectancy": z
    .string()
    .refine((value) => validatePositiveFloat(value, "Healthy life expectancy")),
  "Freedom to make life choices": z
    .string()
    .refine((value) =>
      validatePositiveFloat(value, "Freedom to make life choices"),
    ),
  Generosity: z
    .string()
    .refine((value) => validatePositiveFloat(value, "Generosity")),
  "Perceptions of corruption": z
    .string()
    .refine((value) =>
      validatePositiveFloat(value, "Perceptions of corruption"),
    ),
});

module.exports = MetricData;
