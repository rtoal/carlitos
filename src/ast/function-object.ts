import Parameter from '../ast/parameter';
import Context from '../semantics/context';
import { Body } from '../type-definitions/plainscript-types';
import Referent from './abstract/referent';
import Statement from './abstract/statement';

export default class FunctionObject extends Referent {
  // we use the ! here to tell TypeScript it's
  // ok that these are not initialized in the
  // constructor, as they get initialized in
  // the analyze method.
  public requiredParameterNames!: Set<string>;
  public allParameterNames!: Set<string>;

  constructor(id: string, public params: Parameter[], public body: Body) { super(id); }

  public analyze(context: Context): void {
    // Each parameter will be declared in the function's scope, mixed in
    // with the function's local variables. This is by design.
    this.params.forEach((p: Parameter) => p.analyze(context));
    // Make sure all required parameters come before optional ones, and
    // gather the names up into sets for quick lookup.
    this.requiredParameterNames = new Set();
    this.allParameterNames = new Set();
    this.params.forEach((p) => {
      this.allParameterNames.add(p.id);
      if (p.isRequired) {
        this.requiredParameterNames.add(p.id);
        if (this.requiredParameterNames.size < this.allParameterNames.size) {
          throw new Error('Required parameter cannot appear after an optional parameter');
        }
      }
    });
    // Now we analyze the body with the local context. Note that recursion is
    // allowed, because we've already inserted the function itself into the
    // outer context, so recursive calls will be properly resolved during the
    // usual "outward moving" scope search. Of course, if you declare a local
    // variable with the same name as the function inside the function, you'll
    // shadow it, which would probably be not a good idea.
    if (this.body) {
      this.body.forEach((s) => s.analyze(context));
    }
  }

  public optimize(): FunctionObject {
    this.params.forEach((p) => p.optimize());
    this.body.forEach((s) => s.optimize());
    this.body = this.body.filter((s: Statement) => s !== null);
    // Suggested: Look for returns in the middle of the body
    return this;
  }
}
