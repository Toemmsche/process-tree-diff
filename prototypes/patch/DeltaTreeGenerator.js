/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {Placeholder} = require("../CPEE/Placeholder");
const {CpeeModel} = require("../CPEE/CpeeModel");
const {CpeeNode} = require("../CPEE/CpeeNode");
const {Change} = require("../editscript/Change");


class DeltaTreeGenerator {
    static deltaTree(model, editScript) {
        //copy model
        model = model.copy();
        let placeholderCount = 0;
        for (const change of editScript) {
            switch (change.changeType) {
                case Change.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    const childIndex = indexArr.pop();
                    const parent = this._findNodeByIndexArr(model, indexArr);
                    const child = CpeeNode.parseFromJson(change.newNode);
                    parent.insertChild(childIndex, child);
                    child.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.MOVE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = this._findNodeByIndexArr(model, nodeIndexArr);
                    node.removeFromParent();
                    //Insert placeholder at old position
                    if(node.parent.placeholders === undefined) {
                        node.parent.placeholders = [];
                    }
                    node.parent.placeholders.push(new Placeholder(placeholderCount, node.childIndex));
                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    const targetIndex = parentIndexArr.pop();
                    const parent = this._findNodeByIndexArr(model, parentIndexArr);
                    parent.insertChild(targetIndex, node);
                    node.changeType = change.changeType + " " + placeholderCount++;
                    break;
                }
                case Change.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = this._findNodeByIndexArr(model, nodeIndexArr);
                    const newNode = CpeeNode.parseFromJson(change.newNode);
                    for (const property in newNode) {
                        //preserve structural information
                        if (!property.startsWith("_")) {
                            node[property] = newNode[property]
                        }
                    }
                    node.updated = true;
                    break;
                }
                case Change.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = this._findNodeByIndexArr(model, nodeIndexArr);
                    node.changeType = change.changeType;
                    //Do not actually delete the node, we want to show the delta
                }
            }
        }
        this._expandPlaceholders(model);
        return model;
    }

    static _findNodeByIndexArr(model, indexArr) {
        let currNode = model.root;
        for (let index of indexArr) {
            if (index >= currNode.numChildren()) {
                throw new Error("Edit script not applicable to model");
            }
            currNode = currNode.getChild(index);
        }
        return currNode;
    }

    static _expandPlaceholders(model) {
        for(const oldNode of model.toPreOrderArray()) {
            if("placeholders" in oldNode) {
                //reverse placeholder array to preserve sibling order
                for(const placeholder of oldNode.placeholders.reverse()) {
                    oldNode.insertChild(placeholder.index, placeholder);
                }
                delete oldNode.placeholders;
            }
        }
    }

}

exports.DeltaTreeGenerator = DeltaTreeGenerator;