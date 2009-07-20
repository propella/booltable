// booltable : A simple boolean table generator
//
// Copyright (c) 2009 Takashi Yamamiya <takashi@vpri.org>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

function run(query) {
  var table= getTable(parse(query));
  var html= "<table>";

  html += "<tr>";
  for (var x= 0; x < table[0].length; x++) {
    html += "<th>" + table[0][x] + "</th>";
  }
  html += "</tr>";

  for (var y= 1; y < table.length; y++) {
    html += "<tr>";
    for (var x= 0; x < table[0].length; x++) {
      if (table[y][x]) { html += "<td class='true'>1</td>"; }
      else  { html += "<td class='false'>0</td>"; }
    }
    html += "</tr>";
  }
  html += "</table>";

  html += "<a href='" + getPermlink(query) + "'>permlink</a>";
  return html;
}

function getQuery() {
  var query = window.location.search.substring(1);
  var each = query.split("&");
  for (var i= 0; i < each.length; i++) {
    var pair= each[i].split("=");
    if (pair[0] == "q") return decodeURIComponent(pair[1]);
  }
  return "";
}

// Return link string of the query
function getPermlink(query) {
  return window.location.pathname + "?q=" + encodeURIComponent(query);
}

function getTable(node) {
  var varList= getVarList(node);
  var worlds= enumerate(varList.length);
  var displayNodeList= arrangeNodes(getNodeList(node), varList);
  var result= [];
  var header= [];

  for (var i= 0; i < displayNodeList.length; i++) {
    header.push(show(displayNodeList[i]));
  }
  result.push(header);

  for (var i= 0; i < worlds.length; i++) {
    var line= [];
    var env= makeEnvironment(varList, worlds[i]);
    for (var j= 0; j < displayNodeList.length; j++) {
      line.push(apply(displayNodeList[j], env));
    }
    result.push(line);
  }
  return result;
}

// ---------- Execute ----------

function makeEnvironment(varNames, values) {
  var env= new Object();
  for (var i= 0; i < varNames.length; i++) {
    env[varNames[i]]= values[i];
  }
  return env;
}

function apply(node, env) {
  if (typeof node == "number") return node;
  if (typeof node == "string") return env[node];

  if (node[0] == "+") {
    if (apply(node[1], env) == 1) return 1;
    if (apply(node[2], env) == 1) return 1;
    return 0;
  }
  if (node[0] == "*") {
    if (apply(node[1], env) == 0) return 0;
    if (apply(node[2], env) == 0) return 0;
    return 1;
  }
  if (node[0] == "=>") {
    return apply(["+", ["-", node[1]], node[2]], env);
  }
  if (node[0] == "-") {
    if (apply(node[1], env) == 0) return 1;
    return 0;
  }
  throw "error";
}

// Arrange node lists so that the output is easy to read.
function arrangeNodes(nodeList, varList) {
  var arranged= [];
  for (var i= 0; i < nodeList.length; i++) {
    if (!varList.includes(nodeList[i])) {
      arranged.push(nodeList[i]);
    }
  }
  return varList.concat(arranged.reverse());
}

Array.prototype.includes= function(object) {
  for (var i= 0; i < this.length; i++)
    if (this[i] == object) return true;
  return false;
};

// Return a list of unique variable names.
function getVarList(node) {
  var nodeList=	getNodeList(node);
  var dictionary= new Object();
  for (var i= 0; i < nodeList.length; i++) {
    if (typeof nodeList[i] == "string") {
      dictionary[nodeList[i]]= true;
    }
  }
  var list= [];
  for (key in dictionary) list.push(key);
  return list.sort();
}

// Return a list of all sub nodes
function getNodeList(node) {
  if (typeof node == "string" || typeof node == "number") {
    return [node];
  }
  if (node[0] == "+" || node[0] == "*" || node[0] == "=>") {
    return [node].concat(getNodeList(node[1]), getNodeList(node[2]));
  }
  if (node[0] == "-") {
    return [node].concat(getNodeList(node[1]));
  }
  throw	"unknown operator";
}

// Return a list with all possible n boolean values.
function enumerate(n) {
  if (n == 0) return [[]];
  var children= enumerate(n - 1);
  var falses= [];
  var trues= [];
  for (var i= 0; i < children.length; i++) {
    falses.push([0].concat(children[i]));
    trues.push([1].concat(children[i]));
  }
  return falses.concat(trues);
}

// ---------- Print ----------

function show(node) {
  if (typeof node == "string" || typeof node == "number") {
    return node.toString();
  }
  if (node[0] == "+" || node[0] == "*" || node[0] == "=>") {
    return "(" + show(node[1]) + node[0] + show(node[2]) + ")";
  }
  if (node[0] == "-") {
    return "-" + show(node[1]);
  }
  throw	"unknown operator";
}

// ---------- Read ----------

// All parsers have same signature:
//
// argument     String
// return value [true, parsed tree, rest of source]
//           or [false] if failed

function parse(source) {
  var parsed= parseExpr(source.replace(/\s/g, ""));
  if (parsed[2] == "") return parsed[1];
  throw "parse error: " + parsed[2];
}

function parseLiteral(source) {
  if (source.charAt(0) == "0") return [true, 0, source.slice(1)];
  if (source.charAt(0) == "1") return [true, 1, source.slice(1)];
  return [false];
}

function parseOp(source) {
  if (source.charAt(0) == "*") return [true, "*", source.slice(1)];
  if (source.charAt(0) == "+") return [true, "+", source.slice(1)];
  if (/^=>/.exec(source)) return [true, "=>", source.slice(2)];
  return [false];
}

function parseSymbol(source) {
  return parseRegExp(/^[A-Za-z]/)(source);
}

function parseParenthesis(source) {
  var result= seq(parseRegExp(/^\(/),
              seq(parseExpr,
                  parseRegExp(/^\)/)))(source);
  if (!result[0]) return [false];
  return [true, result[1][1][0], result[2]];
}
function parseNot(source) {
  var result= seq(parseRegExp(/^-/), parsePrim)(source);
  if (!result[0]) return [false];
  return [true, ["-", result[1][1]], result[2]];
}

function parsePrim(source) {
  return orElse(parseParenthesis,
         orElse(parseNot,
         orElse(parseLiteral,
                parseSymbol)))(source);
}

function parseExpr(source) {
  var result= seq(parsePrim,
             many(
              seq(parseOp,
		  parsePrim)))(source);
  if (!result[0]) return [false];
  var newTree= leftRecursion(result[1][0], result[1][1]);
  return [true, newTree, result[2]];
}

function leftRecursion(first, rest) {
  if (rest.length == 0) return first;
  var op= rest[0][0];
  var second= rest[0][1];
  return leftRecursion([op, first, second], rest.slice(1));
}

// Return a parser which accept with the regular expression.
function parseRegExp(regExp) {
  return function(source) {
    var match= regExp.exec(source);
    if (match) return [true, match[0], source.slice(match[0].length)];
    return [false];
  };
}

// ---------- Combinator Parser Library ----------

// Return a list of values using parser until it fails.
function many(parser) {
  return function(source) {
    var result= [];
    while (true) {
      var each= parser(source);
      if (!each[0]) return [true, result, source];
      result.push(each[1]);
      source= each[2];
    }
  };
}

// If parser1 fails then parse2.
function orElse(parser1, parser2) {
  return function(source) {
    var first= parser1(source);
    if (first[0]) return first;
    return parser2(source);
  };
}

// Do parse1 and parse2 and return list of results.
function seq(parser1, parser2) {
  return function(source) {
    var first= parser1(source);
    if (!first[0]) return [false];
    var second= parser2(first[2]);
    if (!second[0]) return [false];
    return [true, [first[1], second[1]], second[2]];
  };
}

// ---------- Test ----------

// Equality check for unit test.
function eq(a, b) {
  if (a == b) return true;
  if (a.constructor != Array) return false;
  if (b.constructor != Array) return false;
  if (a.length != a.length) return false;
  for (var i= 0; i < b.length; i++) {
    if (!eq(a[i], b[i])) return false;
  }
  return true;
}

function testEq(a, b) {
  if (eq(a, b)) out("success");
  else out("expect: " + b + " but: " + a);
}

function runtest() {
  out("-- parser test --");
  testEq(parseLiteral("1!"), [true, 1, "!"]);
  testEq(parseLiteral("a!"), [false]);
  testEq(parseSymbol("a!"), [true, "a", "!"]);
  testEq(parsePrim("a!"), [true, "a", "!"]);
  testEq(orElse(parseLiteral, parseSymbol)("1!"), [true, "1", "!"]);
  testEq(many(parseSymbol)("abc!"), [true, ["a", "b", "c"], "!"]);
  testEq(many(parseSymbol)("1"), [true, [], "1"]);
  testEq(parseExpr("1+a*b"), [true, ["*", ["+", 1, "a"], "b"], ""]);
  testEq(parseExpr("a=>b"), [true, ["=>", "a", "b"], ""]);
  testEq(parseParenthesis("(a+(b+c))"),
         [true, ["+", "a", ["+", "b", "c"]], ""]);
  testEq(parseNot("-(-a+b)"),
         [true, ["-", ["+", ["-", "a"], "b"]], ""]);
  out("-- analize test --");
  testEq(getVarList(["+", "P", ["*", "Q", "R"]]), ["P", "Q", "R"]);
  testEq(getNodeList(["*", ["+", 1, "a"], "b"]),
	 [["*", ["+", 1, "a"], "b"], ["+", 1, "a"], 1, "a", "b"]);
}
