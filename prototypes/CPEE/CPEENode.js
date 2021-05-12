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

const {AbstractEditScript} = require("../editscript/AbstractEditScript");
const {OperationEditScript, Change} = require("../editscript/OperationEditScript");
const {DSL} = require("./DSL");

class CPEENode {

    //TODO parent and sibling relationship, fingerprint considering path and subtree (maybe separate for each)
    //node label (implies type)
    label;
    //Map of key-value attributes
    attributes;
    //ordered child CPEENodes
    childNodes;
    //string data of the node
    data;
    parent;
    childIndex;
    path;

    tempSubTree;

    changeType;
    touchedVariables;



    constructor(label, parent = null, childIndex = -1) {
        this.label = label;
        this.attributes = new Map();
        this.childNodes = [];
        this.data = "";
        this.parent = parent;
        this.childIndex = childIndex;
        if (this.parent == null) {
            this.path = [];
        } else {
            //copy parent path
            this.path = this.parent.path.slice();
        }
        this.path.push(this);


        //TODO
        this.tempSubTree = [];
        this.touchedVariables = new Set();
    }

    hasInternalOrdering() {
        return DSL.hasInternalOrdering(this.label);
    }

    nodeEquals(other) {
        //only compare internal data, not child nodes
        if (this.label !== other.label) return false;
        if (this.data !== other.data) return false;
        if (this.attributes.size !== other.attributes.size) return false;
        for (const [key, value] of this.attributes) {
            if (value !== other.attributes.get(key)) return false;
        }
        return true;
    }

    subTreeEquals(other) {
        //compare node data and child node data (ordered!)
        if (!this.nodeEquals(other)) return false;
        if (this.childNodes.length !== other.childNodes.length) return false;
        for (let i = 0; i < this.childNodes.length; i++) {
            if (!this.childNodes[i].subTreeEquals(other.childNodes[i])) return false;
        }
        return true;
    }

    hasChildren() {
        return this.childNodes.length > 0;
    }

    isControlFlowLeafNode() {
        return DSL.isControlFlowLeafNode(this.label);
    }

    hasPropertySubtree() {
        return DSL.hasPropertySubtree(this.label);
    }

    isPropertyNode() {
        //overridden in subclasses
        return true;
    }

    containsCode() {
        //overridden in subclasses
        return false;
    }

    compareTo(other) {
        //specific subclass implementation may be present
        if (this.label === other.label) return 0;
        else return 1;
    }

    insertChild(cpeeNode, index = 0) {
        cpeeNode.childIndex = index;
        cpeeNode.parent = this;
        cpeeNode.path = this.path.slice();
        cpeeNode.path.push(cpeeNode);
        this.childNodes.splice(index, 0, cpeeNode);
        this.fixChildIndices();
    }

    changeChildIndex(newIndex) {
        //delete
        this.parent.childNodes.splice(this.childIndex, 1);
        //insert
        this.parent.childNodes.splice(newIndex, 0, this);
        //adjust child indices
        this.parent.fixChildIndices();
    }

    fixChildIndices() {
        for (let i = 0; i < this.childNodes.length; i++) {
            this.childNodes[i].childIndex = i;
        }
    }

    removeFromParent() {
        if (this.parent === null) {
            throw new Error();
        }
        this.parent.childNodes.splice(this.childIndex, 1);
        this.parent.fixChildIndices();
    }

    getTypeIndex() {
        let index = 0;
        for (let i = 0; i < this.childIndex; i++) {
            if(this.parent.childNodes[i].label === this.label) {
                index++;
            }
        }
        return index;
    }
    toString(displayType = "label") {
        switch (displayType) {
            case "label":
                return this.label;
            case "label-with-type-index":
                return this.label + "[" + this.getTypeIndex() + "]";
            case "path-with-type-index": {
                const strArr = this.path.map(n => n.toString("label-with-type-index"));
                return  "(" + strArr.join("/") + ")";
            }
            case "path": {
                const strArr = this.path.map(n => n.toString("label"));
                return `${strArr.join("/")}`;
            }
            case "change": {
                let color;
                switch (this.changeType) {
                    case Change.typeEnum.INSERTION:
                        color = AbstractEditScript.green;
                        break;
                    case Change.typeEnum.DELETION:
                        color = AbstractEditScript.red;
                        break;
                    case Change.typeEnum.MOVE:
                        color = AbstractEditScript.yellow;
                        break;
                    case Change.typeEnum.RELABEL:
                        color = AbstractEditScript.cyan;
                        break;
                    case Change.typeEnum.COPY:
                        color = AbstractEditScript.blue;
                        break;
                    default:
                        color = AbstractEditScript.white;
                        break;
                }
                return color + this.label + AbstractEditScript.white;
            }
            default:
                return this.label;
        }

    }

    getSubTreeSize() {
        let size = 1;
        for (const child of this.childNodes) {
            size += child.getSubTreeSize();
        }
        return size;
    }

    copy() {
        const copy = new CPEENode(this.label, this.parent, this.childIndex);
        copy.path = this.path;
        copy.data = this.data;
        copy.tempSubTree = this.tempSubTree;
        for (const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        return copy;
    }

    indexPath() {
        return this.path.map(n => n.childIndex).reverse();
    }

    toPreOrderArray() {
        const preOrderArr = [];
        fillPreOrderArray(this, preOrderArr);

        function fillPreOrderArray(cpeeNode, arr) {
            arr.push(cpeeNode);
            for (const child of cpeeNode.childNodes) {
                fillPreOrderArray(child, arr);
            }
        }

        return preOrderArr;
    }

    toPostOrderArray() {
        const postOrderArr = [];
        fillPostOrderArray(this, postOrderArr);

        function fillPostOrderArray(cpeeNode, arr) {
            for (const child of cpeeNode.childNodes) {
                fillPostOrderArray(child, arr);
            }
            arr.push(cpeeNode);
        }

        return postOrderArr;
    }

    //TODO beautify... (and optimize)
    //similar to unix tree command
    toTreeString(barList, displayType) {
        const isLast = this.parent !== null && this.childIndex === this.parent.childNodes.length - 1;
        let line = "";
        for (let i = 0; i < barList.length; i++) {
            const spaceCount = barList[i] - (i > 0 ? barList[i - 1] : 0) - 1;
            line += " ".repeat(spaceCount);
            if (i === barList.length - 1) {
                if (isLast) {
                    line += "└";
                } else {
                    line += "├";
                }
            } else {
                line += "│";
            }
        }
        if (isLast) {
            barList.pop();
        }
        line += "─";
        barList.push(line.length + 1);
        line += this.toString(displayType) + "\n";
        if (this.hasChildren()) {
            for (const child of this.childNodes) {
                line += child.toTreeString(barList, displayType);
            }
        } else {
            //bar is popped by last child
            barList.pop();
        }

        return line;
    }
}

exports.CPEENode = CPEENode;