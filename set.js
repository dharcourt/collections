"use strict";

var Set = require("./_set");
var PropertyChanges = require("./listen/property-changes");
var RangeChanges = require("./listen/range-changes");
var MapChanges = require("./listen/map-changes");
var GlobalSet;


if(global.Set !== void 0) {
    GlobalSet = global.Set;
    module.exports = Set

    // use different strategies for making sets observable between Internet
    // Explorer and other browsers.
    var protoIsSupported = {}.__proto__ === Object.prototype,
        set_makeObservable;

    if (protoIsSupported) {
        set_makeObservable = function () {
            this.__proto__ = ChangeDispatchSet;
        };
    } else {
        set_makeObservable = function () {
            Object.defineProperties(this, observableSetProperties);
        };
    }

    Object.defineProperty(GlobalSet.prototype, "makeObservable", {
        value: set_makeObservable,
        writable: true,
        configurable: true,
        enumerable: false
    });

    var set_clear = GlobalSet.prototype.clear,
        set_add = GlobalSet.prototype.add,
        set_delete = GlobalSet.prototype.delete;

    var observableSetProperties = {
        "_dispatchEmptyArray": {
            value: []
        },
        clear : {
            value: function () {
                var clearing;
                if (this.dispatchesRangeChanges) {
                    clearing = this.toArray();
                    this.dispatchBeforeRangeChange(this._dispatchEmptyArray, clearing, 0);
                }

                set_clear.call(this);

                if (this.dispatchesRangeChanges) {
                    this.dispatchRangeChange(this._dispatchEmptyArray, clearing, 0);
                }
            },
            writable: true,
            configurable: true

        },
        add : {
            value: function (value) {
                if (!this.has(value)) {
                    var index = this.size;
                    var dispatchValueArray = [value];
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
                    }

                    set_add.call(this,value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
                    }
                    return true;
                }
                return false;
            },
            writable: true,
            configurable: true
        },

        "delete": {
            value: function (value,index) {
                if (this.has(value)) {
                    if(index === undefined) {
                        var setIterator = this.values();
                        index = 0
                        while(setIterator.next().value !== value) {
                            index++;
                        }
                    }
                    var dispatchValueArray = [value];
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(this._dispatchEmptyArray, dispatchValueArray, index);
                    }

                    set_delete.call(this,value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(this._dispatchEmptyArray, dispatchValueArray, index);
                    }
                    return true;
                }
                return false;
            }
        }
    };

    var ChangeDispatchSet = Object.create(GlobalSet.prototype, observableSetProperties);


    Object.defineEach(Set.prototype, PropertyChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
    //This is a no-op test in property-changes.js - PropertyChanges.prototype.makePropertyObservable, so might as well not pay the price every time....
    Object.defineProperty(Set.prototype, "makePropertyObservable", {
        value: function(){},
        writable: true,
        configurable: true,
        enumerable: false
    });

    Object.defineEach(Set.prototype, RangeChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
    Object.defineEach(Set.prototype, MapChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);

}
    var _CollectionsSet = Set.CollectionsSet;

    function CollectionsSet(values, equals, hash, getDefault) {
        return _CollectionsSet._init(CollectionsSet, this, values, equals, hash, getDefault);
    }

    // hack so require("set").Set will work in MontageJS
    CollectionsSet.Set = CollectionsSet;
    CollectionsSet.from = _CollectionsSet.from;
    Set.CollectionsSet = CollectionsSet;

    CollectionsSet.prototype = new _CollectionsSet();
    CollectionsSet.prototype.constructor = CollectionsSet;

    var List = require("./list");
    var FastSet = require("./fast-set");
    CollectionsSet.prototype.Order = List;
    CollectionsSet.prototype.Store = FastSet;

    Object.defineProperty(CollectionsSet.prototype,"_dispatchEmptyArray", {
        value: []
    });

    CollectionsSet.prototype.add = function (value) {
        var node = new this.order.Node(value);
        if (!this.store.has(node)) {
            var index = this.length;
            var dispatchValueArray = [value];
            if (this.dispatchesRangeChanges) {
                this.dispatchBeforeRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
            }
            this.order.add(value);
            node = this.order.head.prev;
            this.store.add(node);
            this.length++;
            if (this.dispatchesRangeChanges) {
                this.dispatchRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
            }
            return true;
        }
        return false;
    };
    CollectionsSet.prototype["delete"] = function (value, equals) {
        if (equals) {
            throw new Error("Set#delete does not support second argument: equals");
        }
        var node = new this.order.Node(value);
        if (this.store.has(node)) {
            node = this.store.get(node);
            var dispatchValueArray = [value];
            if (this.dispatchesRangeChanges) {
                this.dispatchBeforeRangeChange(this._dispatchEmptyArray, dispatchValueArray, node.index);
            }
            this.store["delete"](node); // removes from the set
            this.order.splice(node, 1); // removes the node from the list
            this.length--;
            if (this.dispatchesRangeChanges) {
                this.dispatchRangeChange(this._dispatchEmptyArray, dispatchValueArray, node.index);
            }
            return true;
        }
        return false;
    };
    CollectionsSet.prototype.clear = function () {
        var clearing;
        if (this.dispatchesRangeChanges) {
            clearing = this.toArray();
            this.dispatchBeforeRangeChange(this._dispatchEmptyArray, clearing, 0);
        }
        this._clear();
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeChange(this._dispatchEmptyArray, clearing, 0);
        }
    };

if(global.Set === void 0) {
    module.exports = CollectionsSet
}


Object.addEach(Set.CollectionsSet.prototype, PropertyChanges.prototype);
Object.addEach(Set.CollectionsSet.prototype, RangeChanges.prototype);
Set.CollectionsSet.prototype.makeObservable = function () {
    this.order.makeObservable();
};
