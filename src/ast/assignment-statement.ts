import Context from '../semantics/context';
import { AstNode, Expression, VariableExpression } from '../type-definitions/plainscript-types';

export default class AssignmentStatement extends AstNode<AssignmentStatement> {
  constructor(public targets: VariableExpression[], public sources: Expression[]) { super(); }

  public analyze(context: Context): void {
    if (this.targets.length !== this.sources.length) {
      throw new Error('Number of variables does not equal number of expressions');
    }
    this.sources.forEach((e) => e.analyze(context));
    this.targets.forEach((v) => v.analyze(context));
  }
}
