import * as https from 'https';

class RequestError extends Error {
  readonly statusCode: number;
  readonly statusMessage: string;
  readonly response: any;

  constructor(statusCode: number, statusMessage: string, response: any) {
    super(`${statusCode} ${statusMessage}`);

    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.response = response;
  }
}

export abstract class RequestHelper {

  static fetch(url: string, options: https.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      return https.request(url, options, response => {
        const data: string[] = [];

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
  }
}
