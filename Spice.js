/**
 * When using Spice, always start with Spice().
 * This ensures that you're not using stale spices. Blech!
 * @class
 * @namespace Spice
 * @param {*} __ The value to initialize with
 */
function Spice(__) { return new SpiceRack(__); }

/**
 * This is where the kick comes from!
 * @class
 * @namespace SpiceRack
 * @param {*} __ The value to initialize with
 */
function SpiceRack(__) {
  this.version = '0.1.1';
  // This is what we'll call the original object
  this.__ = this.TopiaObject = __;
  if (typeof this.__ === 'object' && this.__ instanceof Array === false)
    for (property in this.__)
      this[property] = this.__[property];
}

/**
 * Load an inventory
 * @param {Object} inventory Can be either an entity (Me), container (Tree),
 *     or inventory (Me.inventory)
 * @return {SpiceRack} Inventory
 */
SpiceRack.prototype.Inventory = function Inventory(inventory) {
  if (typeof inventory === 'undefined')
    inventory = Me.inventory;
  else if (typeof inventory.inventory !== 'undefined')
    inventory = inventory.inventory;
  return Spice(inventory);
};

/**
 * Find the first item in the chained inventory that is of a specific type
 * @param {String} itemtype
 * @return {SpiceRack} Item if found, null if not
 */
SpiceRack.prototype.GetItemByType = function GetItemByType(itemtype) {
  if (typeof itemtype === 'undefined')
    return this.Abort("Spice.GetItemByType - Please provide an itemtype to " +
        "search for.");
  if (typeof this.__ === 'undefined') {
    return new this.Inventory().GetItemByType(itemtype);
  } else if (typeof this.__.inventory !== 'undefined') {
    return new this.Inventory(this.__).GetItemByType(itemtype);
  }

  var inventory = this.__;
  var items = inventory.length;

  for (var i = 0; i < items; i++)
    if (inventory[i].itemtype == itemtype)
      return Spice(inventory[i]);
  
  return Spice(null);
};

/**
 * Does the entity's inventory contain items?
 * @param {Function} [filter] Filter for items of interest
 */
SpiceRack.prototype.ContainsItems = function ContainsItems(filter) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.ContainsItems - Please initialize Spice with " +
        "an entity.");
  if (typeof this.__.inventory === 'undefined')
    return this.Abort("Spice.ContainsItems - Please initialize Spice with " +
        "an entity that has an inventory.");

  // If no filter is specified, allow everything
  if (typeof filter === 'undefined') filter = function() { return true; };

  // Filter the items in the inventory
  var items = Spice(this.__.inventory).Filter(function(item) {
    return item.itemtype === 'wood'; // Does the inventory contain wood?
  });
  return (items.__.length > 0); // Does it have at least one item of interest?
};

/**
 * Move the chained item
 * @param {Number} destination 0-based slot number
 */
SpiceRack.prototype.MoveItem = function MoveItem(destination) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.MoveItem - Please initialize Spice with an " +
        "object.");

  UseAction("MoveItem", { target: this.__.slot, destination: destination });
};

/**
 * Equip the chained item
 * @param {String} destination Accessory, Back, Body, or Held.
 */
SpiceRack.prototype.Equip = function Equip(destination) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Equip - Please initialize Spice with an item " +
        "to equip.");

  var named_slots = { 'accessory': 30, 'back': 31, 'body': 32, 'held': 33 };
  if (typeof destination === 'undefined') {
    destination = 33;
  } else if (named_slots[destination.toLowerCase()]) {
    destination = named_slots[destination.toLowerCase()];
  } else if (typeof destination !== 'number' ||
             destination < 30 ||
             destination > 33) {
    return this.Abort("Spice.Equip - Please provide an argument of " +
        "'accessory', 'back', 'body', or 'held', or a number including or " +
        "between 30 and 33.");
  }
  this.MoveItem(destination);
};

/**
 * Move towards and pick up an object
 */
SpiceRack.prototype.PickUp = function PickUp() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.PickUp - Please initialize Spice with an item " +
        "to pick up.");

  if (this.__IsNextTo(Me) === true) {
    UseAction('Get', this.__);
  } else {
    MoveTowards(this.__);
  }
};

/**
 * Drop the item (and move to the coordinates first, if necessary)
 * @param {Object} coordinates The coordinates to drop the item at
 */
SpiceRack.prototype.Drop = function Drop(coordinates) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Drop - Please initialize Spice with an item to " +
        "drop.");

  if (!coordinates ||
      typeof coordinates.x === 'undefined' ||
      typeof coordinates.y === 'undefined')
    coordinates = { x: Me.x, y: Me.y };

  if (this.__IsNextTo(coordinates, Me) === true) {
    if (this.__ instanceof Array) {
      UseAction("Drop", { slot: this.__[0].slot, destination: coordinates });
    } else {
      UseAction("Drop", { slot: this.__.slot, destination: coordinates });
    }
    return true;
  } else {
    MoveTowards(coordinates);
    return false;
  }
};

/**
 * Loot the entity
 * @param {Function} [filter] Only look items that match this filter
 */
SpiceRack.prototype.Loot = function Loot(filter) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Loot - Please initialize Spice with an entity " +
        "to loot.");

  if (typeof filter === 'function' && this.ContainsItems(filter) === false)
    return false;

  if (this.__IsNextTo(Me) === false) {
    MoveTowards(this.__);
  } else {
    UseAction("Get", {
      id: this.__.id,
      slot: _.filter(this.__.inventory, filter)[0].slot
    });
  }
  return true;
};

/**
 * Chop the entity (and move to the coordinates first, if necessary)
 * @param {Object} coordinates The coordinates of the entity to chop
 */
SpiceRack.prototype.Chop = function Chop() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Chop - Please initialize Spice with an entity " +
        "to chop.");

  if (IsAdjacent(this.__, Me) === true) {
    UseAction("Chop", this.__);
    return true;
  } else {
    MoveTowards(this.__);
    return false;
  }
};

/**
 * Find conditions within a certain distance
 * @param {Number} [distance] How far do you want to search?
 * @param {Object} [target] Which target are we searching around? Defaults to
*      Me.
 */
SpiceRack.prototype.FindWithinDistance = function FindWithinDistance(
    distance, target) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.FindWithinDistance - Please initialize Spice " +
      "with conditions for a Find(), or with {}.");
  
  if (typeof distance === 'undefined') distance = 10;
  if (typeof target   === 'undefined') target   = Me;

  var conditions = this.__;
  conditions.location = {
    "$within": { "$center": [[ target.x, target.y ], distance * 32 ]
  }};
  return Spice(Find(conditions));
};

/**
 * Filter an array of entities
 * @param {Function} filter Function that returns true if the entity should be
 *     kept, and false if it should be filtered out
 */
SpiceRack.prototype.Filter = function Filter(filter) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Filter - Please initialize Spice with an array " +
      "to filter.");
  if (typeof filter  === 'undefined')
    return this.Abort("Spice.Filter - Please provide a function to filter " +
      "by.");

  return Spice(_.filter(this.__, filter));
};

/**
 * Find the closest entity of an array
 * @param {Object} target What are we checking if this object is closest to?
 */
SpiceRack.prototype.Closest = function Closest(target) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Closest - Please initialize Spice with an array" +
        " of entities.");

  if (typeof target === 'undefined') target = Me;

  // Set up the variables
  var matches = this.__,
      best_match = null,
      current_distance = 9999;

  // Loop through all of the matches, looking for the best
  for (var i = 0; i < matches.length; i++) {
    var examining = matches[i];

    // If this match is closer than our currently selected best_match, use
    // this one instead
    if (Distance(examining, target) < current_distance) {
      best_match = examining;
      current_distance = Distance(examining, target);
    }
  }
  // If we've reached this point, we've checked one or more matches and
  // determined that this is the best one
  return Spice(best_match);
};

/**
 * Stop the script, log an error, and say the error
 * @param {String} message Reason for aborting the script
 */
SpiceRack.prototype.Abort = function Abort(message) {
  Stop();
  Log(message);
  UseAction("Say", message);
};

/**
 * Log the properties and values of an object
 * @param {Boolean} recursive Do you want to inspect the object recursively?
 *     **This is currently Broken**
 */
SpiceRack.prototype.InspectProperties = function InspectProperties(recursive) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.InspectProperties - Please initialize Spice " +
        "with a variable or function/method return to inspect.");

  var output = "\n";
  if (this.__ instanceof Array) {
    output += "Array of " + this.__.length + "\n";
    for (var i = 0; i < this.__.length; i++)
      output += this.__[i].toString() + "\n";
  } else if (typeof this.__ === 'object') {
    for (var property in this.__)
      output += property + ": " + this.__[property] + "\n";
  } else {
    output += this.__.toString();
  }
  Log(output);
};



/**
 * The following functions should only be used in a sandbox!
 */



/**
 * Run a benchmark on the chained function
 * @param {Number} [times] How many times should we run this function?
 * @return {Number} Benchmark time in milliseconds
 */
SpiceRack.prototype.Benchmark = function Benchmark(times) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.Benchmark - Please initialize Spice with a " +
      "function to benchmark.");

  if (typeof times === 'undefined') times = 1;

  var benchmark_time1 = new Date();
  for (var i = 0; i < times; i++)
    this.__();
  var benchmark_time2 = new Date();
  var total = (benchmark_time2.getTime() - benchmark_time1.getTime());
  return total;
};

/**
 * Create an object at your feet
 * @param {Object} entity Entity configuration objects
 * @param {Number} [amount] How many should be created? Defaults to 1
 */
SpiceRack.prototype.__CreateObject = function __CreateObject(entity, amount) {
  if (typeof entity.x === 'undefined') entity.x = Me.x;
  if (typeof entity.y === 'undefined') entity.y = Me.y;
  if (typeof amount   === 'undefined')  amount  = 1;
  
  var entities = [];
  for (var i = 0; i < amount; i++)
    entities.add(World.Create(World.DeepClone(entity)));
  return entities;
};

/**
 * Create an stone at your feet
 * @param {Number} [amount] How many should be created?
 */
SpiceRack.prototype.__CreateStone = function __CreateStone(amount) {
  return this.__CreateObject({
    icon: "SmallRock",
    isobject: true,
    name: "Stone",
    itemtype: "stone"
  }, amount);
};

/**
 * Create an branch at your feet
 * @param {Number} [amount] How many should be created?
 */
SpiceRack.prototype.__CreateBranch = function CreateBranch(amount) {
  return this.__CreateObject({
    icon: "Branch",
    isobject: true,
    name: "Branch",
    itemtype: "branch"
  }, amount);
};

/**
 * Create some wood at your feet
 * @param {Number} [amount] How many should be created?
 */
SpiceRack.prototype.__CreateWood = function __CreateWood(amount) {
  return this.__CreateObject({
      icon: "log",
      isobject: true,
      name: "Wood",
      itemtype: "wood"
  }, amount);
};



/**
 * Waiting for these functions to be added to the Topia scripting engine
 */



/**
 * Is the selected object next to the target
 * @param {Object} target
 * @param {Object} [target2] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 */
SpiceRack.prototype.__IsNextTo = function __IsNextTo(target, target2) {
  if (typeof target2 === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.__IsNextTo - You're missing an argument.");
    target2 = this.__;
  }

  var xDistance = Math.abs(target.x - target2.x);
  var yDistance = Math.abs(target.y - target2.y);

  return (xDistance < 64 && yDistance < 64);
};