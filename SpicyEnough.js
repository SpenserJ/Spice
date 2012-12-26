/**
 * When using SpicyEnough, always start with SpicyEnough().
 * This ensures that you're not using stale tests. Blech!
 * @class
 * @namespace SpicyEnough
 * @param {String} description A description of the test.
 * @param {Function} testing The function to test.
 */
function SpicyEnough(description, testing) {
  return new SpiceTest(description, testing);
}

/**
 * This is where testing is really done.
 * @class
 * @namespace SpiceTest
 * @param {String} description A description of the test.
 * @param {Function} testing The function to test.
 */
function SpiceTest(description, testing) {
  this.version = '0.1';
  this.description = description;
  this.testing = testing;
  this.result = this.testing();
}

SpiceTest.prototype.log = function log(pass, error) {
  Log((pass === true) ?
      "Passed." :
      ("Failed: " + this.description + ((typeof error !== 'undefined') ?
          "\nError: " + error : "")));
}

SpiceTest.prototype.equals = function equals(assertion) {
  this.log(this.result === assertion);
}

SpiceTest.prototype.greaterThan = function greaterThan(assertion) {
  this.log(this.result > assertion);
}

SpiceTest.prototype.greaterThanOrEqualTo =
  function greaterThanOrEqualTo(assertion) {
    this.log(this.result >= assertion);
  }

SpiceTest.prototype.lessThan = function lessThan(assertion) {
  this.log(this.result < assertion);
}

SpiceTest.prototype.lessThanOrEqualTo =
  function lessThanOrEqualTo(assertion) {
    this.log(this.result <= assertion);
  }

SpiceTest.prototype.hasProperties = function hasProperties(assertion) {
  if (assertion instanceof Array) {
    for (var i = 0; i < assertion.length; i++) {
      if (typeof this.result[assertion[i]] === 'undefined')
        return this.log(false, "Missing property \"" + assertion[i] + "\"");
    }
  } else {
    for (var property in assertion) {
      if (typeof this.result[property] === 'undefined')
        return this.log(false, "Missing property \"" + property + "\"");
    }
  }
  this.log(true);
}