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

// Check if this is our first run
if (typeof GetItemInSlot(Me.inventory, 30) === 'undefined') {

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