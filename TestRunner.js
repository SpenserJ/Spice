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
 * Inventory()
 */

SpicyEnough("Ensure inventory is not empty.",
  function() {
    return Me.inventory.length;
  }).greaterThan(0);
var test_item = Me.inventory[0];

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
    'ClosestPoint', 'Distance', 'IsMultiDimensional', 'IsAdjacent', 'IsNextTo',
    '__CreateObject', '__CreateStone', '__CreateBranch', '__CreateWood'];
Log("Still needs testing:\n" + needs_testing.join(", "));