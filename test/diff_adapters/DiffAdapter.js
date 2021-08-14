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

import {XmlFactory} from "../../src/io/XmlFactory.js";
import {TestConfig} from "../TestConfig.js";
import fs from "fs";
import {DiffTestResult} from "../result/DiffTestResult.js";
import xmldom from "xmldom";
import {execFileSync} from "child_process";
import {Logger} from "../../util/Logger.js";
import {DomHelper} from "../../util/DomHelper.js";
import {ActualDiff} from "../actual/ActualDiff.js";

export class DiffAdapter {

    pathPrefix;
    displayName;

    constructor(pathPrefix, displayName) {
        this.pathPrefix = pathPrefix;
        this.displayName = displayName;
    }

    _run(oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = this.pathPrefix + "/" + TestConfig.FILENAMES.OLD_TREE;
        const newFilePath = this.pathPrefix + "/" + TestConfig.FILENAMES.NEW_TREE;

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let time = new Date().getTime();
        return {
            output: execFileSync(this.pathPrefix + "/" + TestConfig.FILENAMES.RUN_SCRIPT, [oldFilePath, newFilePath], TestConfig.EXECUTION_OPTIONS).toString(),
            runtime: new Date().getTime() - time
        }

    }

    _parseOutput(output) {
        let updates = 0;
        let insertions = 0;
        let moves = 0;
        let deletions = 0;

        //parse output
        const delta = DomHelper.firstChildElement(
            new xmldom.DOMParser().parseFromString(output, "text/xml"), "delta");
        DomHelper.forAllChildElements(delta, (xmlOperation) => {
            switch (xmlOperation.localName) {
                case "move":
                    moves++;
                    break;
                case "add":
                case "insert":
                //map copies to insertions
                case "copy":
                    insertions++;
                    break;
                case "remove":
                case "delete":
                    deletions++;
                    break;
                case "update":
                    updates++;
                    break;
            }
        })
        const cost = insertions + moves + updates + deletions;
        return [insertions, moves, updates, deletions, cost];
    }

    evalCase(testCase) {
        let exec;
        try {
            exec = this._run(testCase.oldTree, testCase.newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
                Logger.info(this.displayName + " timed out for " + testCase.name, this);
                return testCase.complete(this.displayName, null, null, TestConfig.VERDICTS.TIMEOUT);
            } else {
                Logger.info(this.displayName + " crashed for " + testCase.name + ": " + e.toString(), this);
                return testCase.complete(this.displayName, null, null, TestConfig.VERDICTS.RUNTIME_ERROR)
            }
        }
        const counters = this._parseOutput(exec.output);
        //An OK verdict is emitted because the diff algorithm didnt fail
        return testCase.complete(this.displayName, exec.runtime,  new ActualDiff(exec.output, ...counters), TestConfig.VERDICTS.OK);
    }
}


