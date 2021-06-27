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
const {Preprocessor} = require("../../src/parse/Preprocessor");
const {CpeeModel} = require("../../src/cpee/CpeeModel");

class ExpectedMatch {

    matchPairs;
    notMatchPairs;

    oldMatched
    notOldMatched;

    newMatched;
    notNewMatched;

    constructor() {
        this.matchPairs = [];
        this.notMatchPairs = [];
        this.oldMatched = [];
        this.notOldMatched = [];
        this.newMatched = [];
        this.notNewMatched = [];
    }
}

exports.ExpectedMatch = ExpectedMatch;
