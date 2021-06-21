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

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {CpeeNodeFactory} = require("./CpeeNodeFactory");
const {Change} = require("../editscript/Change");
const {XmlDomFactory} = require("./XmlDomFactory");
const {Dsl} = require("../Dsl");



class EditScriptFactory {

    static getEditScript(source) {
        switch (source.constructor) {
            case String: return this._fromXml(source);
            default: return this._fromXmlDom(source);
        }
    }

    static _fromXmlDom(xmlDom) {
       //TODO
    }

    static _fromXml(source) {
        //TODO
    }
}


exports.EditScriptFactory = EditScriptFactory;