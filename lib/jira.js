const https = require('https');
const fs = require('fs');

class RequestError extends Error {

  constructor(statusCode, statusMessage, response) {
    super(`${statusCode} ${statusMessage}`);

    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.response = response;
  }
}

const fetch = (url, options) => {
  return new Promise((resolve, reject) => {
    return https.request(url, options, response => {
      const data = [];

      response.on('data', chunk => {
        data.push(chunk);
      });

      response.on('end', async () => {
        const body = data.join('');

        if (response.statusCode !== 200)
          return reject(new RequestError(
            response.statusCode || 0,
            response.statusMessage || '',
            body,
          ));

        return resolve(body);
      });
    }).end();
  });
};

const Context = () => {

  // Config

  const basicAuthPlain = `${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`;
  const basicAuth = Buffer.alloc(basicAuthPlain.length, basicAuthPlain).toString('base64');
  const baseApiUrl = `https://${process.env.JIRA_DOMAIN}/rest/api/${process.env.JIRA_VERSION}/`;
  const outputGroup = (process.env.OUTPUT_NAME || 'default').replace(/\W/g, '');

  // Logic

  const authHeaders = {
    'Authorization': `Basic ${basicAuth}`,
  };

  const getOptions = (method, custom = {}) => {
    return {
      'method': method,
      headers: authHeaders,
      escape: false,
      ...custom,
    };
  };

  const buildParameters = (parameters) => {
    const result = [];

    for (const entry of Object.entries(parameters)) {
      const [key, value] = entry;

      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    return result.join('&');
  };

  const buildUrl = (endpoint, parameters) => {
    return `${baseApiUrl}${endpoint}?${buildParameters(parameters)}`;
  };

  const handleResponse = (response) => {
    return JSON.parse(response);
  };

  const request = async (endpoint, parameters) => {
    const url = buildUrl(endpoint, parameters);

    const response = await fetch(url, getOptions('GET'));

    return handleResponse(response);
  };

  const buildQuery = (data, postfix = undefined) => {
    const operator = data.operator;
    const entries = data.entries;

    if (!postfix) postfix = '';

    if (!operator || !Array.isArray(entries)) throw new Error('Invalid buildQuery data parameter value!');

    const entriesString = entries.map(entry => typeof entry === 'string' ? entry : buildQuery(entry)).join(` ${operator} `);

    if (!postfix) return `(${entriesString})`;

    return `(${entriesString}) ${postfix}`;
  };

  const baseOutputPath = './output';

  const prepareGroupPath = () => {
    if (!fs.existsSync(baseOutputPath)) fs.mkdirSync(baseOutputPath);

    const groupPath = `${baseOutputPath}/${outputGroup}`;

    if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath);

    return groupPath;
  };

  const buildPath = (id) => {
    const groupPath = prepareGroupPath();

    return `${groupPath}/${id}.json`;
  };

  const readOutput = (id) => {
    const path = buildPath(id);

    if (!fs.existsSync(path)) return null;

    const json = fs.readFileSync(path).toString();

    return JSON.parse(json);
  };

  const writeOutput = (id, content) => {
    const path = buildPath(id);

    const json = JSON.stringify(content);

    fs.writeFileSync(path, json);
  };

  const readAllOutput = (mapper) => {
    const groupPath = prepareGroupPath();

    const result = {};

    const files = fs.readdirSync(groupPath);

    for (const file of files) {
      const id = file.split('.')[0];

      try {
        const entry = readOutput(id);

        result[id] = mapper ? mapper(entry) : entry;
      } catch (e) {
        console.error(e);

        const path = buildPath(id);

        fs.unlinkSync(path);
      }
    }

    return result;
  };

  return {
    request,
    buildQuery,
    readOutput,
    writeOutput,
    readAllOutput,
  };
};

module.exports = Context();
