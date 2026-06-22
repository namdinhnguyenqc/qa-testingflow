type Env = Record<string, string | undefined>;

const requiredKeys = [
  'DATABASE_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

const numberKeys = [
  'PORT',
  'REDIS_PORT',
  'MAX_FILE_SIZE_DOC_MB',
  'MAX_FILE_SIZE_XLSX_MB',
  'MAX_FILE_SIZE_IMAGE_MB',
  'MAX_FILE_SIZE_GLOBAL_MB',
];

export function validateEnv(config: Env) {
  const missing = requiredKeys.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const invalidNumbers = numberKeys.filter((key) => {
    const value = config[key];
    return value !== undefined && Number.isNaN(Number(value));
  });

  if (invalidNumbers.length > 0) {
    throw new Error(
      `Environment variables must be valid numbers: ${invalidNumbers.join(', ')}`,
    );
  }

  return {
    ...config,
    PORT: Number(config.PORT ?? 3000),
    REDIS_PORT: Number(config.REDIS_PORT),
    S3_FORCE_PATH_STYLE: config.S3_FORCE_PATH_STYLE ?? 'true',
    OPENAI_DEFAULT_MODEL: config.OPENAI_DEFAULT_MODEL ?? 'gpt-4.1-mini',
    DEFAULT_LANGUAGE: config.DEFAULT_LANGUAGE ?? 'vi',
    MAX_FILE_SIZE_DOC_MB: Number(config.MAX_FILE_SIZE_DOC_MB ?? 30),
    MAX_FILE_SIZE_XLSX_MB: Number(config.MAX_FILE_SIZE_XLSX_MB ?? 20),
    MAX_FILE_SIZE_IMAGE_MB: Number(config.MAX_FILE_SIZE_IMAGE_MB ?? 10),
    MAX_FILE_SIZE_GLOBAL_MB: Number(config.MAX_FILE_SIZE_GLOBAL_MB ?? 30),
  };
}
