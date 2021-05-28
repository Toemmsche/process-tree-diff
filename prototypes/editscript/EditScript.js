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

const fs = require("fs");
const {Serializable} = require("../utils/Serializable");

class EditScript extends Serializable{

    changes;

    constructor() {
        super();
        this.changes = [];
    }

    //TODO add string option enum
    toString(displayType = "lines") {
        switch(displayType) {
            case "lines":
                return this.changes.map(c => c.toString()).join("\n");
        }
    }

    appendChange(change) {
        this.changes.push(change);
    }


    convertToJson() {
        return JSON.stringify(this);
    }

    static parseFromJson(str) {
        return JSON.parse(str);
    }

    [Symbol.iterator]() {
        return this.changes[Symbol.iterator]();
    }

}

exports.EditScript = EditScript;