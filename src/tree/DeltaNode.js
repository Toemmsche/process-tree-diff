/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


import {Node} from "./Node.js"
import {Dsl} from "../Dsl.js";

/**
 * A node inside a CPEE process tree annotated with change related information.
 * This serves as the basis for enhanced and interactive diff visualization.
 * @extends Node
 */
export class DeltaNode extends Node {

    /**
     * The operation type associated with this node, may be NIL
     * @type String
     */
    type;

    /**
     * The updates applied to the content of this node
     * @type Map<String,Update>
     */
    updates;

    /**
     * An array of placeholders that hold optional child nodes that have been removed/moved away from this node.
     * @type [DeltaNode]
     */
    placeholders;

    /**
     * The ID (index in pre-order traversal) of the original node this was mapped to. May be null for inserted nodes.
     * @type Number|null
     */
    baseNode;

    /**
     * Construct a new DeltaNode with the given information.
     * @param {String} label The node label
     * @param {String} text The text content
     * @param {String} type The operation type associated with the node
     * @param {Number|null} baseNode The base node ID
     */
    constructor(label, text = null, type = "NIL", baseNode = null ) {
        super(label, text);
        this.baseNode = baseNode;
        this.type = type;
        this.updates =  new Map();
        this.placeholders = [];
    }

    /**
     * Remove this node from the child list of its parent.
     * Also adjust the child indices of its affected placeholders.
     * @override
     */
    removeFromParent() {
        //adjust parent placeholders
        if(this._parent != null) {
            for (const placeholder of this._parent.placeholders) {
                if (placeholder._childIndex > this._childIndex) {
                    placeholder._childIndex--;
                }
            }
        }
        super.removeFromParent();
    }

    /**
     * Insert a child at a specified position within the child list.
     * Also adjust the child indices of any affected placeholders.
     * @param {Number} index The position at which to insert the node.
     * @param {Node} node The node to insert.
     */
    insertChild(index, node) {
        //adjust placeholders
        for (const placeholder of this.placeholders) {
            if (placeholder._childIndex >= index) {
                placeholder._childIndex++;
            }
        }
        super.insertChild(index, node);
    }

    /**
     * @returns {boolean} If this node was updated.
     */
    isUpdate() {
        return this.updates.size > 0;
    }

    /**
     * @returns {boolean} If this node was moved.
     */
    isMove() {
        return this.type === Dsl.OPERATION_TYPES.MOVE_TO.label
    }

    /**
     * @returns {boolean} If this node was deleted.
     */
    isDeletion() {
        return this.type === Dsl.OPERATION_TYPES.DELETION.label;
    }

    /**
     * @returns {boolean} If this node was inserted.
     */
    isInsertion() {
        return this.type === Dsl.OPERATION_TYPES.INSERTION.label;
    }

    /**
     * @returns {boolean} If this node was not changed.
     */
    isNil() {
        return this.type === Dsl.OPERATION_TYPES.NIL.label;
    }

    //TODO
    toString() {
        let res = this.label;
        res += " <" + this.type + (this.isUpdate() ? "-UPD" : "") + (this.baseNode !== null ? "_" + this.baseNode : "") + ">.js";
        if (this.isUpdate()) {
            for (const [key, change]  of this.updates) {
                res += " " + key + ": [" + change[0] + "] -> [" + change[1] + "].js";
            }
        }
        return res;
    }
}

