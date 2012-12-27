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
 * An enum for directions
 */
SpiceRack.prototype.DirectionEnum = {
  North: 0, 0: 'North',
  East:  1, 1: 'East',
  South: 2, 2: 'South',
  West:  3, 3: 'West'
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
 * @oaram {Object} from What are we checking the distance from?
 * @param {Object} [to] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 * @return {Number} Distance (in pixels) between this target and the selection.
 */
SpiceRack.prototype.Distance = function Distance(from, to) {
  if (typeof to === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.Distance - You're missing an argument.");
    to = this;
  } else if (typeof to.__ === 'undefined') {
    to = Spice(to);
  }
  if (typeof from.__ === 'undefined') from = Spice(from);

  if (from.IsMultiDimensional() === true)
    from = target.ClosestPoint(to);
  if (to.IsMultiDimensional() === true)
    to = to.ClosestPoint(from);

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
 * Determine the direction of the target
 * @oaram {Object} from What are we checking the direction from?
 * @param {Object} [to] You can specify an additional target directly, or
 *     use the already-loaded entity in this.__
 */
SpiceRack.prototype.Direction = function Direction(from, to) {
  if (typeof target2 === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.Distance - You're missing an argument.");
    to = this;
  } else if (typeof to.__ === 'undefined') {
    to = Spice(to);
  }
  if (typeof from.__ === 'undefined') from = Spice(from);

  if (to.x < from.x) return this.DirectionEnum.West;
  if (to.x > from.x) return this.DirectionEnum.East;
  if (to.y < from.y) return this.DirectionEnum.North;
  if (to.y > from.y) return this.DirectionEnum.South;
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
 * Move toward a certain location or path
 */
SpiceRack.prototype.MoveTowards = function MoveTowards() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.MoveTowards - Please initialize Spice with an " +
        "object, entity, or path array.");
  var to = this.__;
  if (to instanceof Array) to = to[0];
    
  var totalDistance = Math.abs(Me.x - to.x) + Math.abs(Me.y - to.y);
  // If we're not right beside it, generate a path and start walking down it.
  if (totalDistance > 32)
    return Spice(this.FindPath(Me, true)).MoveTowards();

  UseAction("Move", Spice(to).Direction(Me));
}

/**
 * A* pathfinding algorithm that accepts maps with and without tile weighting
 * @param {Object} from
 * @param {Object} [to] You can specify a target directly, or use the 
 *     already-loaded entity in this.__
 * @param {Boolean} [visible] Whether or not to pathfind on just the visible
 *     portion of the map. Defaults to true
 */
SpiceRack.prototype.FindPath = function FindPath(from, to, visible) {
  if (typeof to === 'boolean') {
    visible = to;
    to = undefined;
  } else if (typeof to === 'undefined') {
    if (typeof this.__ === 'undefined')
      return this.Abort("Spice.IsNextTo - You're missing an argument.");
    to = this.__;
  }
  if (typeof visible === 'undefined') visible = true;

  var map_data = this.GenerateMap(visible);
  // Set our target as "walkable", otherwise a path can't be generated
  map_data.map[(to.y   - map_data.y) / globalTileDistance - 1]
              [(to.x   - map_data.x) / globalTileDistance - 1] = 1;
  var graph = new Graph(Spice(map_data.map).FlipArray());
  //var graph = new Graph(map_data.map);
  var start = graph.nodes[(from.x - map_data.x) / globalTileDistance - 1]
                         [(from.y - map_data.y) / globalTileDistance - 1];
  var end   = graph.nodes[(to.x   - map_data.x) / globalTileDistance - 1]
                         [(to.y   - map_data.y) / globalTileDistance - 1];
  var path  = astar.search(graph.nodes, start, end);

  var cleaned_path = [];
  for (var i = 0; i < path.length; i++) {
    cleaned_path.push({
      x: ((path[i].x + 1) * globalTileDistance) + map_data.x,
      y: ((path[i].y + 1) * globalTileDistance) + map_data.y
    });
  }

  return cleaned_path;
}

/**
 * Generate a weighted map of the world for pathfinding
 * @param {Boolean} [visible] Whether or not to generate a map of just the
 *     visible portion of the map. Defaults to true
 */
SpiceRack.prototype.GenerateMap = function GenerateMap(visible) {
  if (typeof visible === 'undefined') visible = true;
  var roads = Spice(Find({ name: "Dirt Road" }));
  var obstacles = Spice(Find({ obstacle: true }));
  if (visible === true) {
    roads = roads.__Visible();
    obstacles = obstacles.__Visible();
  }

  var map_data = {
    x: Me.x - 11 * globalTileDistance,
    y: Me.y - 8 * globalTileDistance,
    w: 21 * globalTileDistance,
    h: 15 * globalTileDistance,
    map: []
  };
  for (var y  = map_data.y;
           y  < map_data.y + map_data.h;
           y += globalTileDistance) {
    var map_row = [];
    for (var x  = map_data.x;
             x  < map_data.x + map_data.w;
             x += globalTileDistance) {
      map_row.push(1);
    }
    map_data.map.push(map_row);
  }

  for (var i = 0; i < roads.__.length; i++) {
    map_data.map[(roads.__[i].y - map_data.y) / globalTileDistance]
                [(roads.__[i].x - map_data.x) / globalTileDistance] = 0.5; // Faster
  }
  for (var i = 0; i < obstacles.__.length; i++) {
    map_data.map[(obstacles.__[i].y - map_data.y) / globalTileDistance - 1]
                [(obstacles.__[i].x - map_data.x) / globalTileDistance - 1] = 0; // Blocked
  }

  map_data.map[(Me.y - map_data.y) / globalTileDistance - 1]
              [(Me.x - map_data.x) / globalTileDistance - 1] = 5;

  return map_data;
}

/**
 * Flip the axis of a 2d array
 */
SpiceRack.prototype.FlipArray = function FlipArray() {
  if (typeof this.__ === 'undefined')
    return this.Abort("Spice.FlipArray - Please initialize Spice with an " +
        "array to flip.");
  var new_array = [];
  for (var y = 0; y < this.__.length; y++) {
    for (var x = 0; x < this.__[y].length; x++) {
      if (typeof new_array[x] === 'undefined')
        new_array[x] = [];
      new_array[x][y] = this.__[y][x];
    }
  }
  return new_array;
}

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
      output += "array[" + i + "] = " + this.__[i].toString() + "\n";
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
  if (this.__ instanceof Array === true) {
    for (var i = 0; i < this.__.length; i++)
      Spice(this.__[i]).__MoveToInventory(slot + i);
    return;
  }
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
  if (this.__ instanceof Array === true) {
    for (var i = 0; i < this.__.length; i++)
      Spice(this.__[i]).__RemoveFromInventory();
    return;
  }
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
 * Filter an array for objects that are out of our field of vision
 */
SpiceRack.prototype.__Visible = function __Visible() {
  if (this.__ instanceof Array === false)
    return this.Abort("Spice.__Visible - Please initialize Spice " +
        "with an array of coordinates (or objects with) to filter.");
  return this.Filter(function(checking) {
    return (checking.x >= Me.x - 10 * globalTileDistance &&
            checking.x <= Me.x + 10 * globalTileDistance &&
            checking.y >= Me.y - 7 * globalTileDistance  &&
            checking.y <= Me.y + 7 * globalTileDistance);
  });
}



/**
 * These functions should be included when support for that is added
 */
// javascript-astar
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a binary heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
var astar = {
  init: function(grid) {
    for(var x = 0, xl = grid.length; x < xl; x++) {
      for(var y = 0, yl = grid[x].length; y < yl; y++) {
        var node = grid[x][y];
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.cost = node.type;
        node.visited = false;
        node.closed = false;
        node.parent = null;
      }
    }
  },
  heap: function() {
    return new BinaryHeap(function(node) { 
      return node.f; 
    });
  },
  search: function(grid, start, end, diagonal, heuristic) {
    astar.init(grid);
    heuristic = heuristic || astar.manhattan;
    diagonal = !!diagonal;
    var openHeap = astar.heap();
    openHeap.push(start);
    while(openHeap.size() > 0) {
      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var currentNode = openHeap.pop();
      // End case -- result has been found, return the traced path.
      if(currentNode === end) {
        var curr = currentNode;
        var ret = [];
        while(curr.parent) {
          ret.push(curr);
          curr = curr.parent;
        }
        return ret.reverse();
      }
      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;
      // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
      var neighbors = astar.neighbors(grid, currentNode, diagonal);
      for(var i=0, il = neighbors.length; i < il; i++) {
        var neighbor = neighbors[i];
        if(neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }
        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        var gScore = currentNode.g + neighbor.cost;
        var beenVisited = neighbor.visited;
        if(!beenVisited || gScore < neighbor.g) {
          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor.pos, end.pos);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          }
          else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }
    // No result was found - empty array signifies failure to find path.
    return [];
  },
  manhattan: function(pos0, pos1) {
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    var d1 = Math.abs (pos1.x - pos0.x);
    var d2 = Math.abs (pos1.y - pos0.y);
    return d1 + d2;
  },
  neighbors: function(grid, node, diagonals) {
    var ret = [];
    var x = node.x;
    var y = node.y;
    // West
    if(grid[x-1] && grid[x-1][y]) {
      ret.push(grid[x-1][y]);
    }
    // East
    if(grid[x+1] && grid[x+1][y]) {
      ret.push(grid[x+1][y]);
    }
    // South
    if(grid[x] && grid[x][y-1]) {
      ret.push(grid[x][y-1]);
    }
    // North
    if(grid[x] && grid[x][y+1]) {
      ret.push(grid[x][y+1]);
    }
    if (diagonals) {
      // Southwest
      if(grid[x-1] && grid[x-1][y-1]) {
        ret.push(grid[x-1][y-1]);
      }
      // Southeast
      if(grid[x+1] && grid[x+1][y-1]) {
        ret.push(grid[x+1][y-1]);
      }
      // Northwest
      if(grid[x-1] && grid[x-1][y+1]) {
        ret.push(grid[x-1][y+1]);
      }
      // Northeast
      if(grid[x+1] && grid[x+1][y+1]) {
        ret.push(grid[x+1][y+1]);
      }
    }
    return ret;
  }
};

var GraphNodeType = { 
  OPEN: 1, 
  WALL: 0 
};
// Creates a Graph class used in the astar search algorithm.
function Graph(grid) {
  var nodes = [];
  for (var x = 0; x < grid.length; x++) {
    nodes[x] = [];
    
    for (var y = 0, row = grid[x]; y < row.length; y++) {
      nodes[x][y] = new GraphNode(x, y, row[y]);
    }
  }
  this.input = grid;
  this.nodes = nodes;
}
Graph.prototype.toString = function() {
  var graphString = "\n";
  var nodes = this.nodes;
  var rowDebug, row, y, l;
  for (var x = 0, len = nodes.length; x < len; x++) {
    rowDebug = "";
    row = nodes[x];
    for (y = 0, l = row.length; y < l; y++) {
      rowDebug += row[y].type + " ";
    }
    graphString = graphString + rowDebug + "\n";
  }
  return graphString;
};
function GraphNode(x,y,type) {
  this.data = { };
  this.x = x;
  this.y = y;
  this.pos = {
    x: x, 
    y: y
  };
  this.type = type;
}
GraphNode.prototype.toString = function() {
  return "[" + this.x + " " + this.y + "]";
};
GraphNode.prototype.isWall = function() {
  return this.type == GraphNodeType.WALL;
};

function BinaryHeap(scoreFunction){
  this.content = [];
  this.scoreFunction = scoreFunction;
}
BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);
    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
       this.content[0] = end;
       this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);
  
    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();
    if (i !== this.content.length - 1) {
      this.content[i] = end;
      
      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      }
      else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];
    // When at 0, an element can not sink any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1,
        parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length,
      element = this.content[n],
      elemScore = this.scoreFunction(element);
    
    while(true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1, child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
      // Look it up and compute its score.
      var child1 = this.content[child1N],
        child1Score = this.scoreFunction(child1);
      // If the score is less than our element's, we need to swap.
      if (child1Score < elemScore)
        swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N],
          child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }
      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};