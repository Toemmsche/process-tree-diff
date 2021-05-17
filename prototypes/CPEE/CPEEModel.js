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

const {CPEENode} = require("./CPEENode");
const {DOMParser} = require("xmldom");


const {DSL} = require("./DSL");
const {Call} = require("./leafs/Call");
const {CallWithScript} = require("./leafs/CallWithScript");
const {Escape} = require("./leafs/Escape");
const {Manipulate} = require("./leafs/Manipulate");
const {Stop} = require("./leafs/Stop");
const {Terminate} = require("./leafs/Terminate");
const {Alternative} = require("./inner_nodes/Alternative");
const {Choose} = require("./inner_nodes/Choose");
const {Critical} = require("./inner_nodes/Critical");
const {Loop} = require("./inner_nodes/Loop");
const {Otherwise} = require("./inner_nodes/Otherwise");
const {Parallel} = require("./inner_nodes/Paralel");
const {ParallelBranch} = require("./inner_nodes/ParallelBranch");
const {Root} = require("./inner_nodes/Root");

//TODO doc
class CPEEModel {

    //CPEENode
    root;

    constructor(root) {
        this.root = root;
    }

    static newNodeFromLabel(nodeLabel) {
        switch (nodeLabel) {
            case DSL.CALL:
                return new Call();
            case DSL.MANIPULATE:
                return new Manipulate();
            case DSL.PARALLEL:
                return new Parallel();
            case DSL.PARALLEL_BRANCH:
                return new ParallelBranch();
            case DSL.CHOOSE:
                return new Choose();
            case DSL.ALTERNATIVE:
                return new Alternative();
            case DSL.OTHERWISE:
                return new Otherwise();
            case DSL.ESCAPE:
                return new Escape();
            case DSL.STOP:
                return new Stop();
            case DSL.LOOP:
                return new Loop();
            case DSL.TERMINATE:
                return new Terminate();
            case DSL.CRITICAL:
                return new Critical();
            case DSL.ROOT:
                return new Root();
            default:
                return new CPEENode(nodeLabel);
        }
    }

    //Standard XML file (not a CPEE model)
    static from(xml) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const model = new CPEEModel(constructRecursive(doc));
        return model;

        function constructRecursive(tNode) {
            const root = new CPEENode(tNode.tagName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childNode = tNode.childNodes.item(i);
                if (childNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childNode.data;
                    }
                } else {
                    root.appendChild(constructRecursive(tNode.childNodes.item(i)));
                }
            }

            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }
            return root;
        }
    }

    //TODO doc
    static fromCPEE(xml, options = []) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        return  new CPEEModel(constructRecursive(doc));


        function constructRecursive(tNode) {
            let root = CPEEModel.newNodeFromLabel(tNode.tagName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childTNode = tNode.childNodes.item(i);
                if (childTNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childTNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childTNode.data;
                    }
                } else {
                    const child = constructRecursive(childTNode)
                    //empty control nodes are null values (see below)
                    if (child !== null) {
                        //if this node has child properties, hoist them
                        if (!root.isPropertyNode() && child.isPropertyNode()) {
                            //remove unnecessary path
                            //first ancestor is parent of first entry in path
                           buildChildAttributeMap(child, root.childAttributes);
                        } else {
                            root.appendChild(child);
                        }
                    }
                }
            }

            function buildChildAttributeMap(node, map) {

                if (node.data != "") { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    map.set(node.toString(CPEENode.STRING_OPTIONS.PATH), node.data);
                }

                //copy all values into new map
                for(const child of node.childNodes) {
                    buildChildAttributeMap(child, map);
                }
            }
            
            //if root cannot contain any semantic information, it is discarded
            if (root.isEmpty() || root.isDocumentation()) {
                return null;
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }

            //extract necessary/declared data variables
            if (root.containsCode()) {
                let code = "";
                if (root instanceof Manipulate) {
                    code = root.data;
                } else {
                    //concatenate everything (if present)
                    const prepare = (root.childAttributes.has("code/prepare") ? root.childAttributes.get("code/prepare"): "");
                    const finalize =  (root.childAttributes.has("code/finalize") ? root.childAttributes.get("code/finalize") : "");
                    const update =  (root.childAttributes.has("code/update") ? root.childAttributes.get("code/update") : "");
                    const rescue =  (root.childAttributes.has("code/rescue") ? root.childAttributes.get("code/rescue") : "");
                    code = prepare + finalize + update + rescue;
                }

                if (code != "") {
                    //extract variables using regex
                    const touchedVariables = new Set();
                    //match all variable assignments of the form variable_1.variable_2.variable_3 = some_value
                    const matches = code.match(/([a-zA-Z]+\w*\.)*[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
                    if(matches !== null) {
                        for (const variable of matches) {
                            //match only variable name
                            touchedVariables.add(variable.match(/([a-zA-Z]+\w*\.)*[a-zA-Z]+\w*/g)[0]);
                        }
                        root.touchedVariables = touchedVariables;
                    }
                }
            }

            return root;
        }
    }

    //TODO doc
    toPreOrderArray() {
        return this.root.toPreOrderArray();
    }

    toPostOrderArray() {
        return this.root.toPostOrderArray();
    }

    leafNodes() {
        return this.toPreOrderArray().filter(n => !n.hasChildren());
    }

    toTreeString(stringOption = CPEENode.STRING_OPTIONS.LABEL) {
        return this.root.toTreeString([], stringOption);
    }

    static parseFromJSON(str) {
        function reviver(key, value) {
            if (value instanceof Object) {
                //all maps are marked
                if ("dataType" in value && value.dataType === "Map") {
                    return new Map(value.value)
                } else if ("label" in value) {
                    const node = CPEEModel.newNodeFromLabel(value["label"]);
                    for (const property in node) {
                        node[property] = value[property];
                    }
                    for (const child of node.childNodes) {
                        child.parent = node;
                    }
                    return node;
                }
            }
            return value;
        }

        return JSON.parse(str, reviver)
    }

}

exports.CPEEModel = CPEEModel;