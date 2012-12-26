/**
 * When using Spice, always start with Spice().
 * This ensures that you're not using stale spices. Blech!
 * @class
 * @namespace Spice
 */
function Spice(__) {
  // This ensures that we don't try to SpiceRack our SpiceRack.
  // We don't like SpiceRacks THAT much, Xzibit!
  return (__ instanceof SpiceRack) ? __ : new SpiceRack(__);
}

/**
 * This is where the kick comes from!
 * @class
 * @namespace SpiceRack
 */
function SpiceRack(__) {
  this.version = '0.1.3';
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
    return Spice().Inventory().ContainsItems(filter);
  if (typeof this.__.inventory !== 'undefined')
    return this.Inventory().ContainsItems(filter);

  // If no filter is specified, allow everything
  if (typeof filter === 'undefined') filter = function() { return true; };

  // Filter the items in the inventory
  var items = Spice(this.__).Filter(filter);
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

  if (this.IsNextTo(Me) === true) {
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

  if (this.IsNextTo(coordinates, Me) === true) {
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

  if (this.IsNextTo(Me) === false) {
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

  if (this.IsAdjacent(Me) === true) {
    UseAction("Chop", this);
    return true;
  } else {
    MoveTowards(this);
    return false;
  }
};

/**
 * Find conditions within a certain distance
 * @param {Number} [distance] How far do you want to search?
 * @param {Object} [target] Which target are we searching around? Defaults to
 *     Me.
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
 * Find the properties owned by the selected entity.
 */
SpiceRack.prototype.FindProperties = function FindProperties() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.FindProperties - Please initialize Spice with " +
        "an entity to find properties for.");

  if (typeof this.__.property === 'undefined')
    return this.Abort("Spice.FindProperties - Please initialize Spice with " +
        "an entity that contains a property.");

  return Spice(this.__.property);
}

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
    var examining = Spice(matches[i]),
        distance  = examining.Distance(target);

    // If this match is closer than our currently selected best_match, use
    // this one instead
    if (distance < current_distance) {
      best_match = examining.__;
      
      // If the object or entity is multi-dimensional, find the closest point.
      if (examining.IsMultiDimensional() === true)
        best_match.closest_point = examining.ClosestPoint(target);

      current_distance = distance;
    }
  }

  // If we've reached this point, we've checked one or more matches and
  // determined that this is the best one
  return Spice(best_match);
};

/**
 * Find the closest point for a multi-dimensional object or entity.
 * @param {Object} target What are we checking if this object is closest to?
 * @return {Object} Coordinates of the closest point
 */
SpiceRack.prototype.ClosestPoint = function ClosestPoint(target) {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.ClosestPoint - Please initialize Spice with an " +
        "object or entity.");

  if (typeof target === 'undefined') target = Me;

  var coordinates = { };
  if (target.x < this.x) {
    // Target is West of object
    coordinates.x = this.x;
  } else {
    if (target.x > (this.x + (this.width - 1) * globalTileDistance)) {
      // Target is East of object
      coordinates.x = (this.x + (this.width - 1) * globalTileDistance);
    } else {
      // Target is between West and East edges
      coordinates.x = target.x;
    }
  }

  if (target.y < this.y) {
    // Target is North of object
    coordinates.y = this.y;
  } else {
    if (target.y > (this.y + (this.height - 1) * globalTileDistance)) {
      // Target is South of object
      coordinates.y = (this.y + (this.height - 1) * globalTileDistance);
    } else {
      // Target is between North and South edges
      coordinates.y = target.y;
    }
  }

  return coordinates;
}

/**
 * Calculate the distance to a 1x1 object, or a multidimensional object
 * @oaram {Object} target What are we checking the distance to?
 * @param {Object} [target2] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 * @return {Number} Distance (in pixels) between this target and the selection.
 */
SpiceRack.prototype.Distance = function Distance(target, target2) {
  if (typeof target2 === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.Distance - You're missing an argument.");
    target2 = this;
  } else if (typeof target2.__ === 'undefined') {
    target2 = Spice(target2);
  }
  if (typeof target.__ === 'undefined') target = Spice(target);

  if (target.IsMultiDimensional() === true)
    target = target.ClosestPoint(target2);
  if (target2.IsMultiDimensional() === true)
    target2 = target2.ClosestPoint(target);

  // We now have the two points that are closest to each other, and can
  // calculate the distance between them.
  var xDistance = (target.x - target2.x);
  xDistance = xDistance * xDistance;

  var yDistance = (target.y - target2.y);
  yDistance = yDistance * yDistance;

  var totalDistance = parseInt(Math.sqrt(xDistance + yDistance));

  return totalDistance;
}

/**
 * Is the object or entity multi-dimensional?
 * @return {Boolean}
 */
SpiceRack.prototype.IsMultiDimensional = function IsMultiDimensional() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.IsMultiDimensional - Please initialize Spice " +
        "with an object or entity.");
  return (typeof this.width !== 'undefined' &&
          typeof this.height !== 'undefined');
}

/**
 * IsAdjacent with support for multi-dimensional objects and entities
 * @param {Object} target
 * @param {Object} [target2] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 */
SpiceRack.prototype.IsAdjacent = function IsAdjacent(target, target2) {
  if (typeof target2 === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.IsAdjacent - Please initialize Spice with an " +
          "object or entity.");
    target2 = this;
  } else if (typeof target2.__ === 'undefined') {
    target2 = Spice(target2);
  }
  if (typeof target === 'undefined')
      return this.Abort("Spice.IsAdjacent - The target argument is required.");
  if (typeof target.__ === 'undefined') target = Spice(target);

  // If neither have width and height, pass it off to the unpatched version
  if (target.IsMultiDimensional()  === true)
    target  = target.ClosestPoint(target2);
  if (target2.IsMultiDimensional() === true)
    target2 = target2.ClosestPoint(target);

  if ((target.x + globalTileDistance == target2.x  ||
       target.x - globalTileDistance == target2.x) &&
      target.y == target2.y)
    return true;

  if ((target.y + globalTileDistance == target2.y  ||
       target.y - globalTileDistance == target2.y) &&
      target.x == target2.x)
    return true;

  return false;
}

/**
 * Is the selected object next to the target
 * @param {Object} target
 * @param {Object} [target2] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 */
SpiceRack.prototype.IsNextTo = function IsNextTo(target, target2) {
  if (typeof target2 === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.IsNextTo - You're missing an argument.");
    target2 = this.__;
  }

  var xDistance = Math.abs(target.x - target2.x);
  var yDistance = Math.abs(target.y - target2.y);

  return (xDistance < 64 && yDistance < 64);
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
 * @return {Object} The entity/entities that were created
 */
SpiceRack.prototype.__CreateObject = function __CreateObject(entity, amount) {
  if (typeof entity.x === 'undefined') entity.x = Me.x;
  if (typeof entity.y === 'undefined') entity.y = Me.y;
  if (typeof amount   === 'undefined')  amount  = 1;
  
  var entities = [];
  for (var i = 0; i < amount; i++)
    entities.add(World.Create(World.DeepClone(entity)));
  return (entities.length === 1) ? entities[0] : entities;
};

/**
 * Create an stone at your feet
 * @param {Number} [amount] How many should be created?
 * @param {Object} [coordinates] The coordinates to create the item at
 * @return {Object} The entity/entities that were created
 */
SpiceRack.prototype.__CreateStone = function __CreateStone(amount,
  coordinates) {
  return this.__CreateObject({
    icon: "SmallRock",
    isobject: true,
    name: "Stone",
    itemtype: "stone",
    x: ((typeof coordinates !== 'undefined') ? coordinates.x : Me.x),
    y: ((typeof coordinates !== 'undefined') ? coordinates.y : Me.y)
  }, amount);
};

/**
 * Create an branch at your feet
 * @param {Number} [amount] How many should be created?
 * @param {Object} [coordinates] The coordinates to create the item at
 * @return {Object} The entity/entities that were created
 */
SpiceRack.prototype.__CreateBranch = function CreateBranch(amount,
  coordinates) {
  return this.__CreateObject({
    icon: "Branch",
    isobject: true,
    name: "Branch",
    itemtype: "branch",
    x: ((typeof coordinates !== 'undefined') ? coordinates.x : Me.x),
    y: ((typeof coordinates !== 'undefined') ? coordinates.y : Me.y)
  }, amount);
};

/**
 * Create some wood at your feet
 * @param {Number} [amount] How many should be created?
 * @param {Object} [coordinates] The coordinates to create the item at
 * @return {Object} The entity/entities that were created
 */
SpiceRack.prototype.__CreateWood = function __CreateWood(amount, 
  coordinates) {
  return this.__CreateObject({
    icon: "log",
    isobject: true,
    name: "Wood",
    itemtype: "wood",
    x: ((typeof coordinates !== 'undefined') ? coordinates.x : Me.x),
    y: ((typeof coordinates !== 'undefined') ? coordinates.y : Me.y)
  }, amount);
};

/**
 * Delete the objects specified
 * @param {Object} [deleting] An individual object or array of objects to
 *     delete from the world.
 */
SpiceRack.prototype.__Delete = function __Delete(deleting) {
  if (deleting instanceof Array === true) {
    for (var i = 0; i < deleting.length; i++) {
      this.__Delete(deleting[i]);
    }
  } else {
    World.Delete(deleting);
  }
};

/**
 * Move an item to your inventory without UseAction("Get")
 * @param {Number} [slot] The slot to insert the item into
 */
SpiceRack.prototype.__MoveToInventory = function __MoveToInventory(slot) {
  World.Delete(this.__);
  var item = CreateInventoryItem(this.__);
  if (typeof slot !== 'undefined') {
    var to_drop = GetItemInSlot(Me.inventory, slot);
    if (typeof to_drop !== 'undefined')
      Spice(to_drop).__RemoveFromInventory();
    item.slot = slot;
  }
  Me.inventory.add(item);
  usingAction = true;
  World.Save(Me);
  usingAction = false;
}

/**
 * Remove an item from your inventory without UseAction("Drop")
 */
SpiceRack.prototype.__RemoveFromInventory = function __RemoveFromInventory() {
  var item = this.__;
  Me.inventory = RemoveItemFromInventory(Me.inventory, item.slot);
  item.x = Me.x;
  item.y = Me.y;
  delete(item.slot);
  usingAction = true;
  World.Create(item);
  World.Save(Me);
  usingAction = false;
}




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

SpiceTest.prototype.notEquals = function notEquals(assertion) {
  this.log(this.result !== assertion);
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








/**
 * Ensure we have all of the software required
 */

if (typeof Spice === 'undefined' ||
    typeof SpiceRack === 'undefined' ||
    typeof SpicyEnough === 'undefined' ||
    typeof SpiceTest === 'undefined') {
  Stop();
  UseAction("Say", "Please load Spice and SpicyEnough before testing.");
  Log("Please load Spice and SpicyEnough before testing.");
  return;
}

// Add a few empty lines, so we can see where this test begins.
Log("\n\n\n\n\n\n\n\n\n");

// Disable erroring out in SpiceRack
SpiceRack.prototype.Abort = function Abort(message) {
  Log("SpiceRack threw error:\n" + message);
};

// Read our current position, in binary
function getPosition() {
  var binary = [];
  for (var i = 20; i < 30; i++)
    binary.push((typeof GetItemInSlot(Me.inventory, i) !== 'undefined') ? 1 : 0);
  return parseInt(binary.join(''), 2);
}

function setPosition(new_position) {
  var binary = new_position.toString(2);
  for (var i = 0; i < binary.length; i++) {
    if (binary[binary.length - 1 - i] === '1' &&
        typeof GetItemInSlot(Me.inventory, 29 - i) === 'undefined') {
      var bit = Spice().__CreateStone();
      Spice(bit).__MoveToInventory(29 - i);
    } else if (binary[binary.length - 1 - i] === '0' &&
        typeof GetItemInSlot(Me.inventory, 29 - i) !== 'undefined') {
      Spice(GetItemInSlot(Me.inventory, 29 - i)).__RemoveFromInventory();
    }
  }
}

// Check if this is our first run
switch (getPosition()) {
  case 0:

    /**
     * Ensure proper instantiation
     */

    SpicyEnough("new SpiceRack(Me) instantiates properly",
      function() {
        return new SpiceRack(Me).TopiaObject;
      }).equals(Me);

    SpicyEnough("Spice(Me) instantiates properly",
      function() {
        return Spice(Me).TopiaObject;
      }).equals(Me);

    SpicyEnough("Spice(Me) has expected properties - Array provided",
      function() {
        return Spice(Me);
      }).hasProperties(['id', 'x', 'y', 'name', 'race', 'icon', 'layers',
          'isactor', 'inventoryslots', 'inventory', 'influence', 'property',
          'recipes', 'scriptid', 'delay']);

    SpicyEnough("Spice(Me) has expected properties - Object provided",
      function() {
        return Spice(Me);
      }).hasProperties(Me);

    /**
     * Sandbox item deletion and creation
     */

    var test_item = FindClosest({ isobject: true });
    SpicyEnough("Spice().__Delete() deletes the specified item",
      function() {
        Spice().__Delete(test_item);
        return FindClosest({ isobject: true });
      }).notEquals(test_item);

    // Clear the ground for the next tests
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));
    Spice().__Delete(Find({ isobject: true, x: 64,   y: 64   }));
    Spice().__Delete(Find({ isobject: true, x: 128,  y: 128  }));

    SpicyEnough("Spice().__CreateObject() creates an item as specified, at our " +
      "feet",
      function() {
        Spice().__CreateObject({
          icon: "SmallRock",
          isobject: true,
          name: "Stone",
          itemtype: "stone"
        });
        return Find({ name: "Stone", x: Me.x, y: Me.y }).length;
      }).greaterThan(0);
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    SpicyEnough("Spice().__CreateObject() creates an item as specified, at the " +
      "desired coordinates",
      function() {
        Spice().__CreateObject({
          icon: "SmallRock",
          isobject: true,
          name: "Stone",
          itemtype: "stone",
          x: 128,
          y: 128
        });
        return Find({ name: "Stone", x: 128, y: 128 }).length;
      }).greaterThan(0);
    Spice().__Delete(Find({ isobject: true, x: 128,  y: 128  }));

    SpicyEnough("Spice().__CreateObject() creates the specified number of items",
      function() {
        Spice().__CreateObject({
          icon: "SmallRock",
          isobject: true,
          name: "Stone",
          itemtype: "stone",
        }, 5);
        return Find({ name: "Stone", x: Me.x, y: Me.y }).length;
      }).greaterThanOrEqualTo(5);
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    SpicyEnough("Spice().__CreateStone(2) creates two stone at our feet",
      function() {
        Spice().__CreateStone(2);
        return Find({ name: "Stone", x: Me.x, y: Me.y }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    SpicyEnough("Spice().__CreateBranch(2) creates two branches at our feet",
      function() {
        Spice().__CreateBranch(2);
        return Find({ name: "Branch", x: Me.x, y: Me.y }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    SpicyEnough("Spice().__CreateWood(2) creates two wood at our feet",
      function() {
        Spice().__CreateWood(2);
        return Find({ name: "Wood", x: Me.x, y: Me.y }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    SpicyEnough("Spice().__CreateStone(2, { x: 64, y: 64 }) creates two stone " +
      "at 64,64",
      function() {
        Spice().__CreateStone(2, { x: 64, y: 64 });
        return Find({ name: "Stone", x: 64, y: 64 }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: 64, y: 64 }));

    SpicyEnough("Spice().__CreateBranch(2, { x: 64, y: 64 }) creates two " +
      "branches at 64,64",
      function() {
        Spice().__CreateBranch(2, { x: 64, y: 64 });
        return Find({ name: "Branch", x: 64, y: 64 }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: 64, y: 64 }));

    SpicyEnough("Spice().__CreateWood(2, { x: 64, y: 64 }) creates two wood " +
      "at 64,64",
      function() {
        Spice().__CreateWood(2, { x: 64, y: 64 });
        return Find({ name: "Wood", x: 64, y: 64 }).length;
      }).greaterThanOrEqualTo(2);
    Spice().__Delete(Find({ isobject: true, x: 64, y: 64 }));

    /**
     * Sandbox __MoveToInventory() and __RemoveFromInventory()
     */

    var inventory_length = Me.inventory.length;
    SpicyEnough("Spice(item).__RemoveFromInventory() removes item from " +
      "inventory and drops it on the ground",
      function() {
        Spice(Me.inventory[0]).__RemoveFromInventory();
        return Me.inventory.length;
      }).equals(inventory_length - 1);

    var inventory_length = Me.inventory.length;
    SpicyEnough("Spice(item).__MoveToInventory() moves the item from " +
      "the ground to the first available slot in your inventory",
      function() {
        Spice(Find({ isobject: true, x: Me.x, y: Me.y })).__MoveToInventory();
        return Me.inventory.length;
      }).equals(inventory_length + 1);

    while (Me.inventory.length > 1)
      Spice(Me.inventory[0]).__RemoveFromInventory();
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));

    setPosition(1);
    Log("Completed step 1");
    return;

  case 1:

    /**
     * IsNextTo()
     */

    Spice().__Delete(Find({ isobject: true, x: Me.x + 32, y: Me.y + 32 }));
    var test_item_32 = Spice().__CreateStone(1, { x: Me.x + 32, y: Me.y + 32 });
    SpicyEnough("Spice(item).IsNextTo(Me) returns true if we're next to the item",
      function() {
        return Spice(test_item_32).IsNextTo(Me);
      }).equals(true);
    Spice().__Delete(test_item_32);

    Spice().__Delete(Find({ isobject: true, x: Me.x + 64, y: Me.y + 32 }));
    var test_item_64 = Spice().__CreateStone(1, { x: Me.x + 64, y: Me.y + 64 });
    SpicyEnough("Spice(item).IsNextTo(Me) returns false if we're not next to " +
      "the item",
      function() {
        return Spice(test_item_64).IsNextTo(Me);
      }).equals(false);
    Spice().__Delete(test_item_64);

    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));
    var test_item = Spice().__CreateStone(1, { x: Me.x, y: Me.y });
    SpicyEnough("Spice(item).IsNextTo(Me) returns true if we're above the item",
      function() {
        return Spice(test_item).IsNextTo(Me);
      }).equals(true);
    Spice().__Delete(test_item);

    /**
     * Inventory()
     */

    SpicyEnough("Ensure inventory is not empty.",
      function() {
        return Me.inventory.length;
      }).greaterThanOrEqualTo(4);

    SpicyEnough("Spice().Inventory() returns Me.inventory",
      function() {
        return Spice().Inventory().TopiaObject;
      }).equals(Me.inventory);

    SpicyEnough("Spice(Me).Inventory() returns Me.inventory",
      function() {
        return Spice(Me).Inventory().TopiaObject;
      }).equals(Me.inventory);

    SpicyEnough("Spice(Me.inventory).Inventory() returns Me.inventory",
      function() {
        return Spice(Me.inventory).Inventory().TopiaObject;
      }).equals(Me.inventory);

    /**
     * Drop()
     */

    /**
     * How do you write a test for something that cancels execution?
     */
    
    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));
    SpicyEnough("Spice(item).Drop() drops an item at our feet",
      function() {
        Spice(Me.inventory[0]).Drop();
        return Find({ isobject: true, x: Me.x, y: Me.y }).length;
      }).equals(1);
    
    Spice().__Delete(Find({ isobject: true, x: Me.x + 32, y: Me.y + 32 }));
    SpicyEnough("Spice(item).Drop(coordinates) drops an item at the " +
      "specified coordinates",
      function() {
        Spice(Me.inventory[0]).Drop({ x: Me.x + 32, y: Me.y + 32 });
        return Find({ isobject: true, x: Me.x + 32, y: Me.y + 32 }).length;
      }).equals(1);

    Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));
    SpicyEnough("Spice().Drop() all of our items at our feet",
      function() {
        Spice().Drop();
        return Find({ isobject: true, x: Me.x, y: Me.y }).length;
      }).greaterThanOrEqualTo(2);

    setPosition(2);
    break;

  case 2:
}

return Log('Done tests');
/**
 * PickUp()
 */

/*
 * How do you write a test for something that cancels execution?

Spice().__Delete(Find({ isobject: true, x: Me.x, y: Me.y }));
var test_item = Spice().__CreateStone();
var inventory_size = Me.inventory.length;
SpicyEnough("Spice(item).PickUp() picks up the specified item at our feet",
  function() {
    Spice(test_item).PickUp();
    return Me.inventory.length;
  }).equals(inventory_size + 1);*/

/**
 * GetItemByType()
 */

SpicyEnough("Spice(Me).Inventory().GetItemByType(item.itemtype) returns the " +
  "correct item",
  function() {
    return Spice(Me).Inventory().GetItemByType(test_item.itemtype).TopiaObject;
  }).equals(test_item);

/**
 * ContainsItems()
 */

SpicyEnough("Spice().ContainsItems() returns true if the inventory is not " +
  "empty",
  function() {
    return Spice().ContainsItems();
  }).equals(true);

SpicyEnough("Spice().Inventory().ContainsItems() returns true if the " +
  "inventory is not empty",
  function() {
    return Spice().Inventory().ContainsItems();
  }).equals(true);

SpicyEnough("Spice(Me).ContainsItems() returns true if the inventory is not " +
  " empty",
  function() {
    return Spice(Me).ContainsItems();
  }).equals(true);

SpicyEnough("Spice(Me).Inventory().ContainsItems() returns true if the " +
  "inventory is not empty",
  function() {
    return Spice(Me).Inventory().ContainsItems();
  }).equals(true);

SpicyEnough("Spice().ContainsItems() returns true if the item was found",
  function() {
    return Spice().ContainsItems(function(item) {
      return (item.name === test_item.name);
    });
  }).equals(true);

SpicyEnough("Spice().ContainsItems() returns false if the item was not found",
  function() {
    return Spice().ContainsItems(function(item) {
      return (item.name === 'this item does not exist.');
    });
  }).equals(false);







var needs_testing = ['MoveItem', 'Equip', 'PickUp', 'Drop', 'Loot', 'Chop',
    'FindWithinDistance', 'FindProperties', 'Filter', 'Closest',
    'ClosestPoint', 'Distance', 'IsMultiDimensional', 'IsAdjacent'];
Log("Still needs testing:\n" + needs_testing.join(", "));