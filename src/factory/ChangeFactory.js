/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {NodeFactory} from "./NodeFactory.js";
import {Change} from "../editscript/Change.js";
import xmldom from "xmldom";

export class ChangeFactory {

    static getChange(source) {
        switch (source.constructor) {
            case String: return this._fromXml(source);
            default: return this._fromXmlDom(source);
        }
    }

    static _fromXmlDom(xmlElement) {
        const [changeType, oldPath, newPath] = [xmlElement.localName, xmlElement.attributes.getNamedItem("oldPath"), xmlElement.attributes.getNamedItem("newPath")];
        let newData;
        for (let i = 0; i <xmlElement.childNodes.length ; i++) {
            const childTNode = xmlElement.childNodes.item(i);

            if(childTNode.localName === "newData") {
                newData = NodeFactory.getNode(childTNode, true);
            }
        }
        return new Change(changeType, oldPath, newPath, newData);
    }

    static _fromXml(xml) {
        return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, "text/xml"));
    }
}