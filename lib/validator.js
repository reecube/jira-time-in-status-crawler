const stringValidator = value => typeof value === 'string' && value.length;

const envValidator = {
  JIRA_DOMAIN: stringValidator,
  JIRA_VERSION: stringValidator,
  JIRA_USERNAME: stringValidator,
  JIRA_PASSWORD: stringValidator,
  JIRA_JQL: stringValidator,
};

for (const entry of Object.entries(envValidator)) {
  const [key, validator] = entry;

  if (!validator(process.env[key]))
    throw new Error(`Invalid type '${typeof process.env[key]}' for .env key '${key}'!`);
}
