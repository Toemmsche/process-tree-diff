/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {Dsl} = require("../Dsl");
const {CpeeNode} = require("./CpeeNode");

class DeltaNode extends CpeeNode {

    //diff related information
    /**
     * @type String
     */
    changeType;
    updates;
    moveIndex;
    placeholders;

    //origin of the change. Used for three-way merging
    changeOrigin;

    constructor(label) {
        super(label);
        //NIL change type indicates no change
        this.changeType = "NIL";
        this.updates = new Map();
        this.placeholders = [];
        this.moveIndex = null;
    }

    static parseFromXml(xml, xmlDom = false) {
        return this.fromCpeeNode(CpeeNode.parseFromXml(xml, xmlDom));
    }

    static fromCpeeNode(node, includeChildNodes = true) {
        const root = new DeltaNode(node.label);
        root.data = node.data;
        for (const [key, value] of node.attributes) {
            root.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of node) {
                root.appendChild(this.fromCpeeNode(child, true))
            }
        }
        return root;
    }

    removeFromParent() {
        //adjust parent placeholders
        for (const placeholder of this._parent.placeholders) {
            if (placeholder._childIndex > this._childIndex) {
                placeholder._childIndex--;
            }
        }
        super.removeFromParent();
    }

    insertChild(index, node) {
        for (const placeholder of this.placeholders) {
            if (placeholder._childIndex >= index) {
                placeholder._childIndex++;
            }
        }
        super.insertChild(index, node);
    }

    isUpdate() {
        return this.updates.size > 0;
    }

    isMove() {
        return this.changeType === Dsl.CHANGE_TYPES.MOVE_TO;
    }

    isDeletion() {
        return this.changeType === Dsl.CHANGE_TYPES.DELETION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_DELETION;
    }

    isInsertion() {
        return this.changeType === Dsl.CHANGE_TYPES.INSERTION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_INSERTION;
    }

    isNil() {
        return this.changeType === Dsl.CHANGE_TYPES.NIL;
    }

    toString() {
        let res = this.label;
        res += " <" + this.changeType + (this.isUpdate() ? "-UPD" : "") + (this.moveIndex !== null ? "_" + this.moveIndex : "") + ">";
        if (this.isUpdate()) {
            for (const [key, change]  of this.updates) {
                res += " " + key + ": [" + change[0] + "] -> [" + change[1] + "]";
            }
        }
        return res;
    }

    copy(includeChildNodes = true) {
        const copy = new DeltaNode(this.label);
        copy.data = this.data;
        copy.changeType = this.changeType;
        copy.moveIndex = this.moveIndex;

        for (const [key, change] of this.updates) {
            copy.updates.set(key, change.slice());
        }
        for (const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const placeholder of this.placeholders) {
                copy.placeholders.push(placeholder.copy(true));
            }
            for (const child of this) {
                copy.appendChild(child.copy(true))
            }
        }
        copy.changeOrigin = this.changeOrigin;
        return copy;
    }

    convertToXml( xmlDom = false, includeChildNodes = true) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
        const root = constructRecursive(this);

        if (xmlDom) {
            return root;
        } else {
            doc.insertBefore(root, null);
            return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
        }

        function constructRecursive(deltaNode) {
            const changeType = deltaNode.changeType;

            const prefix = Dsl.NAMESPACES[changeType + "_NAMESPACE_PREFIX"] + ":"
            const node = doc.createElement(prefix + deltaNode.label);
            node.localName = deltaNode.label;

            //TODO delta variables
            if (deltaNode.label === Dsl.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.NIL_NAMESPACE_PREFIX, Dsl.NAMESPACES.NIL_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX, Dsl.NAMESPACES.INSERT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX, Dsl.NAMESPACES.DELETE_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_TO_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_TO_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX, Dsl.NAMESPACES.UPDATE_NAMESPACE_URI);
            }


            //set namespace of updated fields
            for(const [key, change] of deltaNode.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                if(key === "data") {
                    deltaNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":data", "true");
                } else {
                    if(oldVal == null) {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX + ":" + key, val );
                        deltaNode.attributes.delete(key);
                    } else if(newVal == null) {
                        deltaNode.attributes.set(Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX + ":" + key, oldVal);
                    } else {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":" + key, val);
                        deltaNode.attributes.delete(key);
                    }
                }
            }

            for (const [key, value] of deltaNode.attributes) {

                node.setAttribute(key, value);
            }

            if (includeChildNodes) {
                for (const child of deltaNode) {
                    node.appendChild(constructRecursive(child));
                }
            }

            if (deltaNode.data != null) {
                node.appendChild(doc.createTextNode(deltaNode.data))
            }

            return node;
        }
    }

}

exports.DeltaNode = DeltaNode;