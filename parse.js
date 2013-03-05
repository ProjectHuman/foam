/*
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ErrorReportingPS = {
  create: function(delegate, opt_pos) {
console.log('ERPS:',delegate.head);
    return {
      __proto__: this,
      pos: opt_pos || 0,
      delegate: delegate
    };
  },
  get head() {
console.log('head:',this.pos, this.delegate.head);
    return this.delegate.head;
  },
  get tail() {
    return this.tail_ || (this.tail_ = this.create(this.delegate.tail, this.pos+1));
  },
  get value() {
    return this.delegate.value;
  },
  setValue: function(value) {
console.log('setValue:',value);
//    return ErrorReportingPS.create(this.delegate.setValue(value)); 
    this.delegate = this.delegate.setValue(value);
    return this;
  }
};


/** String PStream **/
var StringPSProto = {
  setValue: function(value) {
    return {
      __proto__: StringPSProto,
      head: this.head,
      tail: this.tail,
      value: value
    };
  }
};

function stringPS(str) {
  var prev;

  var tail = {
    __proto__: StringPSProto
  };

  tail.tail = tail;

  for ( var i = str.length-1 ; i >= 0 ; i-- ) {
    var ps = {
      setValue: StringPSProto.setValue,
      head: str.charAt(i),
      tail: tail
    };

    tail.value = ps.head;

    tail = ps;
  }

  return tail;
}

function prep(arg) {
  if ( typeof arg === 'string' ) return literal(arg);

  return arg;
}

function prepArgs(args) {
  for ( var i = 0 ; i < args.length ; i++ ) {
    args[i] = prep(args[i]);
  }

  return args;
}

function range(c1, c2) {
  return function(ps) {
    if ( ! ps.head ) return undefined;
    if ( ps.head < c1 || ps.head > c2 ) return undefined;
    return ps.tail.setValue(ps.head);
  };
}

function literal(str) {
  return function(ps) {
    for ( var i = 0 ; i < str.length ; i++, ps = ps.tail ) {
      if ( str.charAt(i) !== ps.head ) return undefined;
    }

    return ps.setValue(str);
  };
}

function anyChar(ps) {
  return ps.head ? ps.tail/*.setValue(ps.head)*/ : undefined;
}

function notChar(c) {
  return function(ps) {
    return ps.head && ps.head !== c ? ps.tail.setValue(ps.head) : undefined;
  };
}

function not(p, opt_else) {
  p = prep(p);
  opt_else = prep(opt_else);
  return function(ps) {
    return this.parse(p,ps) ? undefined :
      opt_else ? this.parse(opt_else, ps) :
      ps;
  };
}

function optional(p) {
  p = prep(p);
  return function(ps) { return this.parse(p,ps) || ps.setValue(undefined); };
}


function repeat(p, opt_delim, opt_min, opt_max) {
  p = prep(p);
  opt_delim = prep(opt_delim);

  return function(ps) {
    var ret = [];

    for ( var i = 0 ; ! opt_max || i < opt_max ; i++ ) {
      var res;

      if ( opt_delim && ret.length != 0 ) {
        if ( ! ( res = this.parse(opt_delim, ps) ) ) break;
        ps = res;
      }

      if ( ! ( res = this.parse(p,ps) ) ) break;

      ret.push(res.value);
      ps = res;
    }

    if ( opt_min && ret.length < opt_min ) return undefined;

    return ps.setValue(ret);
  };
}

/** A simple repeat which doesn't build an array of parsed values. **/
function repeat0(p) {
  p = prep(p);

  return function(ps) {
    while ( true ) {
      var res;

      if ( ! ( res = this.parse(p,ps) ) ) break;

      ps = res;
    }

    return ps;
  };
}

function seq(/* vargs */) {
  var args = prepArgs(arguments);

  return function(ps) {
    var ret = [];

    for ( var i = 0 ; i < args.length ; i++ ) {
      if ( ! ( ps = this.parse(args[i], ps) ) ) return undefined;
      ret.push(ps.value);
    }

    return ps.setValue(ret);
  };
}

function alt(/* vargs */) {
  var args = prepArgs(arguments);
  var map  = {};

  function nullParser() { return undefined; }

  function testParser(p, ps) {
    var c = ps.head;
    var trapPS = {
      getValue: function() {
        return this.value;
      },
      setValue: function(v) {
        this.value = v;
      },
      value: ps.value,
      head: c
    };
    var goodChar = false;

    trapPS.__defineGetter__('tail', function() {
      goodChar = true;
      return {
        value: this.value,
        getValue: function() {
          return this.value;
        },
        setValue: function(v) {
          this.value = v;
        }
      };
    });

    this.parse(p, trapPS);

// console.log('*** TestParser:',p,c,goodChar);
    return goodChar;
  }

  function getParserForChar(ps) {
    var c = ps.head;
    var p = map[c];

    if ( ! p ) {
      var alts = [];

      for ( var i = 0 ; i < args.length ; i++ ) {
        var parser = args[i];

        if ( testParser.call(this, parser, ps) ) alts.push(parser);
      }

      p = alts.length == 0 ? nullParser :
        alts.length == 1 ? alts[0] :
        simpleAlt.apply(null, alts);

      map[c] = p;
    }

    return p;
  }

  return function(ps) {
    return this.parse(getParserForChar.call(this, ps), ps);
  };
}

// function simpleAlt(/* vargs */) {
function alt(/* vargs */) {
  var args = prepArgs(arguments);

  return function(ps) {
    for ( var i = 0 ; i < args.length ; i++ ) {
      var res = this.parse(args[i], ps);

      if ( res ) return res;
    }

    return undefined;
  };
}

// alt = simpleAlt;

