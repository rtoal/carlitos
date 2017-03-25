/*
 * Parser module
 *
 *   const parse = require('./parser');
 *
 *   parse(text)
 *       returns the abstract syntax tree for the given program text. This
 *       function will first pre-parse (figure out indents and dedents)
 *       before parsing with an Ohm grammar, then applying AST generation
 *       rules. If there are any errors, this function will throw an error
 *       message.
 */

const fs = require('fs');
const ohm = require('ohm-js');
const withIndentsAndDedents = require('./preparser');

const Program = require('../ast/program');
const AssignmentStatement = require('../ast/assignment-statement');
const BreakStatement = require('../ast/break-statement');
const ReturnStatement = require('../ast/return-statement');
const IfStatement = require('../ast/if-statement');
const WhileStatement = require('../ast/while-statement');
const FunctionDeclaration = require('../ast/function-declaration');
const BinaryExpression = require('../ast/binary-expression');
const UnaryExpression = require('../ast/unary-expression');
const VariableExpression = require('../ast/variable-expression');
const Call = require('../ast/call');
const Parameter = require('../ast/parameter');
const Argument = require('../ast/argument');
const BooleanLiteral = require('../ast/boolean-literal');
const NumericLiteral = require('../ast/numeric-literal');

const grammar = ohm.grammar(fs.readFileSync('./syntax/carlitos.ohm'));

// Ohm turns `x?` into either [x] or [], which we should clean up for our AST.
function unpack(a) {
  return a.length === 0 ? null : a[0];
}

/* eslint-disable no-unused-vars */
const astGenerator = grammar.createSemantics().addOperation('ast', {
  Program(body) { return new Program(body.ast()); },
  Stmt_simple(statement, _) { return statement.ast(); },
  Stmt_while(_, test, suite) { return new WhileStatement(test.ast(), suite.ast()); },
  Stmt_if(_1, eFirst, sFirst, _2, eRest, sRest, _3, sLast) {
    const cases = [new IfStatement.Case(eFirst.ast(), sFirst.ast())];
    const tests = eRest.ast();
    const bodies = sRest.ast();
    tests.forEach((test, index) => { cases.push(new IfStatement.Case(test, bodies[index])); });
    return new IfStatement(cases, sLast.ast());
  },
  Stmt_def(_1, id, _2, params, _3, suite) {
    return new FunctionDeclaration(id.sourceString, params.ast(), suite.ast());
  },
  SimpleStmt_assign(v, _, e) { return new AssignmentStatement(v.ast(), e.ast()); },
  SimpleStmt_break(_) { return new BreakStatement(); },
  SimpleStmt_return(_, e) { return new ReturnStatement(unpack(e.ast())); },
  Suite_small(_1, statement, _2) { return [statement.ast()]; },
  Suite_large(_1, _2, _3, statements, _4) { return statements.ast(); },
  Exp_or(left, _1, right) { return new BinaryExpression('Or', left.ast(), right.ast()); },
  Exp_and(left, _1, right) { return new BinaryExpression('And', left.ast(), right.ast()); },
  Exp1_binary(left, op, right) {
    return new BinaryExpression(op.sourceString, left.ast(), right.ast());
  },
  Exp2_binary(left, op, right) {
    return new BinaryExpression(op.sourceString, left.ast(), right.ast());
  },
  Exp3_binary(left, op, right) {
    return new BinaryExpression(op.sourceString, left.ast(), right.ast());
  },
  Exp4_unary(op, operand) { return new UnaryExpression('-', operand.ast()); },
  Exp5_parens(_1, expression, _2) { return expression.ast(); },
  Call(fun, _1, args, _2) { return new Call(fun.ast(), args.ast()); },
  VarExp(id) { return new VariableExpression(id); },
  Param(id, _, exp) { return new Parameter(id.sourceString, unpack(exp.ast())); },
  Arg(id, _, exp) { return new Argument(unpack(id.ast()), exp.ast()); },
  NonemptyListOf(first, _, rest) { return [first.ast()].concat(rest.ast()); },
  EmptyListOf() { return []; },
  boollit(_) { return new BooleanLiteral(this.sourceString); },
  numlit(_1, _2, _3, _4, _5, _6) { return new NumericLiteral(+this.sourceString); },
  id(_1, _2) { return this.sourceString; },
});
/* eslint-enable no-unused-vars */

exports.parse = (text) => {
  const match = grammar.match(withIndentsAndDedents(text));
  if (!match.succeeded()) {
    throw match.message;
  }
  return astGenerator(match).ast();
};
