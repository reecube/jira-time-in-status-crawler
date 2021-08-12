require('dotenv').config();

const envValidator = {
  JIRA_DOMAIN: 'string',
  JIRA_VERSION: 'string',
  JIRA_USERNAME: 'string',
  JIRA_PASSWORD: 'string',
};

for (const entry of Object.entries(envValidator)) {
  const [key, type] = entry;

  if (typeof process.env[key] !== type)
    throw new Error(`Invalid type '${typeof process.env[key]}' for .env key '${key}'!`);
}

console.log('YAY!');
