const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');

const rootDir = path.resolve(__dirname, '..');
const contractsDir = path.join(rootDir, 'contracts');
const schemasDir = path.join(contractsDir, 'schemas');
const openApiPath = path.join(contractsDir, 'openapi.yaml');

const requiredOpenApiFragments = [
  '/projects',
  '/projects/{id}',
  '/projects/{projectId}/artifacts',
  '/artifacts/{id}/parse',
  '/projects/{projectId}/requirements/analyze',
  '/requirements/versions/{id}',
  '/requirements/versions/{id}/quality',
  '/requirements/versions/{id}/gaps',
  '/gaps/{id}',
  '/requirements/versions/{id}/rewrite',
  '/requirements/versions/{id}/approve',
  '/requirements/versions/{id}/testcase-sets',
  '/testcase-sets/{id}',
  '/test-cases/{id}',
  '/testcase-sets/{id}/coverage',
  '/testcase-sets/{id}/exports/excel',
  '/projects/{projectId}/exports',
  '/exports/{id}/download',
  '/workflow-runs/{id}',
  '/workflow-runs/{id}/retry',
  '/workflow-runs/{id}/cancel',
  '/projects/{projectId}/ai-call-logs',
  '/projects/{projectId}/audit-logs',
  '/configs/ai-providers/{id}/test-connection',
  '/configs/prompt-versions',
  '/configs/prompt-versions/{id}',
  '/configs/prompt-versions/{id}/activate',
  '/projects/{projectId}/configs/gate',
  '/projects/{projectId}/configs/budget',
  '/audit-logs',
  '/projects/{projectId}/cost-summary',
  '/projects/{projectId}/budget-status',
  '/skills/figma-reader',
  '/skills/test-call',
];

function validateJsonSchemas() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const schemaFiles = fs
    .readdirSync(schemasDir)
    .filter((fileName) => fileName.endsWith('.schema.json'))
    .sort();

  if (schemaFiles.length === 0) {
    throw new Error('No JSON schema files found');
  }

  for (const fileName of schemaFiles) {
    const schemaPath = path.join(schemasDir, fileName);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    ajv.compile(schema);
  }

  return schemaFiles;
}

function validateOpenApiSkeleton() {
  const openApi = fs.readFileSync(openApiPath, 'utf8');
  const missing = requiredOpenApiFragments.filter(
    (fragment) => !openApi.includes(fragment),
  );

  if (missing.length > 0) {
    throw new Error(`OpenAPI is missing required paths: ${missing.join(', ')}`);
  }
}

try {
  const schemaFiles = validateJsonSchemas();
  validateOpenApiSkeleton();
  console.log(
    `Contracts valid: ${schemaFiles.length} JSON schemas compiled and OpenAPI Phase 1/2 paths are present.`,
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}
