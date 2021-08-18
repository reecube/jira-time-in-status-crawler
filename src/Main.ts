import { Dictionary } from './support/Types';
import { Context } from './Context';
import { Crawl } from './actions/Crawl';
import { Report } from './actions/Report';
import { BaseAction } from './actions/BaseAction';
import { Project } from './model/Project';
import { Loader } from './support/Loader';
import { Projects } from './projects/Projects';

const stringValidator = (value: any) => typeof value === 'string' && value.length;

const envValidator: Dictionary<any> = {
  JIRA_DOMAIN: stringValidator,
  JIRA_VERSION: stringValidator,
  JIRA_USERNAME: stringValidator,
  JIRA_PASSWORD: stringValidator,
};

export class Main {
  private readonly loader = new Loader();

  validate(): void {
    for (const entry of Object.entries(envValidator)) {
      const [key, validator] = entry;

      if (!validator(process.env[key]))
        throw new Error(`Invalid type '${typeof process.env[key]}' for .env key '${key}'!`);
    }
  }

  async run(): Promise<void> {
    const args = [...process.argv];

    args.shift(); // Remove executable path
    args.shift(); // Remove cwd

    const selectedProject = args.shift() || '';

    if (!selectedProject) throw new Error(`Empty project not supported!`);

    const selectedAction = (args.shift() || '').toLowerCase();

    if (!selectedAction) throw new Error(`Empty action not supported!`);

    const projects = Projects.get();

    if (!projects.length) throw new Error(`Empty projects not supported!`);

    let project: Project | false = false;

    for (const entry of projects) {
      if (entry.name !== selectedProject) continue;

      project = entry;

      break;
    }

    if (!project) throw new Error(`Unknown project name '${selectedProject}'!`);

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
