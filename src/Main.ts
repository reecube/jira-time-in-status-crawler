import * as fs from 'fs';

import { Dictionary } from './support/Types';
import { Context } from './Context';
import { Crawl } from './actions/Crawl';
import { Report } from './actions/Report';
import { BaseAction } from './actions/BaseAction';
import { Project } from './model/Project';
import { PathHelper } from './support/PathHelper';
import { Loader } from './support/Loader';

const stringValidator = (value: any) => typeof value === 'string' && value.length;

const envValidator: Dictionary<any> = {
  JIRA_DOMAIN: stringValidator,
  JIRA_VERSION: stringValidator,
  JIRA_USERNAME: stringValidator,
  JIRA_PASSWORD: stringValidator,
  JIRA_JQL: stringValidator,
};

export class Main {
  private readonly basePathProjects = './projects';

  private readonly loader = new Loader();

  validate(): void {
    for (const entry of Object.entries(envValidator)) {
      const [key, validator] = entry;

      if (!validator(process.env[key]))
        throw new Error(`Invalid type '${typeof process.env[key]}' for .env key '${key}'!`);
    }
  }

  private loadProjects(): Project[] {
    const projects: Project[] = [];

    const files = fs.readdirSync(this.basePathProjects);

    for (const file of files) {
      const ext = PathHelper.getExtension(file);

      if (ext !== 'js') continue;

      const name = PathHelper.getBasename(file);

      if (name === '_template') continue;

      const project: Project = require(`../${this.basePathProjects}/${file}`);

      (project as any).name = name;

      projects.push(project);
    }

    return projects;
  }

  async run(): Promise<void> {
    const args = [...process.argv];

    args.shift(); // Remove executable path
    args.shift(); // Remove cwd

    const projects = this.loadProjects();
    const project = projects[0];

    if (!project) throw new Error(`Empty project not supported!`);

    const selectedAction = (args.shift() || '').toLowerCase();

    if (!selectedAction) throw new Error(`Empty action not supported!`);

    const context = new Context(project, this.loader);

    const actions: BaseAction[] = [
      new Crawl(context, args),
      new Report(context, args),
    ];

    for (const action of actions) {
      if (action.type === selectedAction) return await action.run();
    }

    throw new Error(`Unknown report type '${selectedAction}'!`);
  }

  stop() {
    this.loader.stop();
  }
}
