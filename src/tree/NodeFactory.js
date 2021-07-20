/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {AbstractNodeFactory} from "./AbstractNodeFactory.js";
import {Node} from "./Node.js"
import xmldom from "xmldom";

export class NodeFactory extends AbstractNodeFactory {

    static _fromNode(node, includechildren) {
        const copy = new Node(node.label, node.text);
        for (const [key, value] of node.attributes) {
            copy.attributes.set(key, value);
        }
        if (includechildren) {
            for (const child of node) {
                copy.appendChild(this._fromNode(child, includechildren));
            }
        }
        return copy;
    }

    static _fromXmlString(xml, includechildren) {
        return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, "text/xml"), includechildren);
    }

    static _fromXmlDom(xmlElement, includechildren) {
        let root = new Node(xmlElement.localName);

        if(!(xmlElement.nodeType === 1 || xmlElement.nodeType === 3)) {
            return null;
        }
        //parse attributes
        for (let i = 0; i < xmlElement.attributes.length; i++) {
            const attrNode = xmlElement.attributes.item(i);
            root.attributes.set(attrNode.name, attrNode.value);
        }

        for (let i = 0; i < xmlElement.childNodes.length; i++) {
            const childElement = xmlElement.childNodes.item(i);
            if (childElement.nodeType === 3) { //text node
                //check if text node contains a non-empty payload
                if (childElement.data.match(/^\s*$/) !== null) { //match whole string
                    //empty data, skip
                    continue;
                } else {
                    //relevant data, set as node text
                    root.text = childElement.data;
                }
            } else if (includechildren) {
                const child = this._fromXmlDom(childElement, includechildren);
                if(child != null) {
                    root.appendChild(child);
                }
            }
        }
        return root;
    }
}