import Joi from "joi";

const envSchema = Joi.object({
  // api essentialss
  PORT: Joi.number().integer().min(1).max(65535).required(),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  BASE_URL: Joi.string().uri().required(),
}).unknown(true);

export default function validateEnv() {
  // console.log("Validating environment variables...", process.env);
  const { error } = envSchema.validate(process.env);
  if (error) {
    throw new Error(
      `Environment validation error: ${error.details[0]?.message}`
    );
  }
}
