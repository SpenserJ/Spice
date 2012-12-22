# Spice (v0.1.1)
Developed by MalevolentJalapeno (Spenser Jones)

## Download
You can download the most recent version of Spice (v0.1.1) by [clicking here](https://github.com/SpenserJ/Spice/raw/master/Spice.js).

## Usage
Start by initializing Spice() on any entity, array, or even without an argument. After that, start calling some functions on it, and watch in amazement as your script is cut in half (or more!)

## Examples
### Find and chop the closest living tree
```javascript
Spice(Find({ tree: true })).Filter(function(tree) { return tree.durability > 0; }).Closest().Chop();
```
### Find an axe in your inventory, and equip it
```javascript
Spice(Me).Inventory().GetItemByType('axe').Equip();
```
### Find and pick up any objects
```javascript
Spice(Find({ isobject: true })).Closest().PickUp();
```

## Debugging and testing scripts
From time to time, you may run into a confusing variable or array, and say to yourself "I wish I could see what was in this, without writing for loops and calling Log repeatedly!"
```javascript
Spice(GetItemByName('Stone')).InspectProperties();
```

### Creating objects in the sandbox
Writing a big script, and tired of collecting resources before starting to test your logic? Sounds like it is time to spawn a few objects at your feet!
```javascript
Spice().__CreateStone(5);  // Create 5 stones
Spice().__CreateBranch(3); // Create 3 branches
Spice().__CreateWood(1);    // Create 1 wood
Spice().__CreateObject({ icon: "stoneaxe", isobject: true, name: "Axe", itemtype: "axe" }, 8); // Create 8 defined objects
```

## Thank You to:
* skawesome - Assistance with the Class structure logic