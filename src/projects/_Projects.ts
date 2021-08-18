import { Project } from '../model/Project';
import { _Template } from './_Template';

export abstract class Projects {
  static get(): Project[] {
    return [
      new _Template(),
    ];
  }
}
