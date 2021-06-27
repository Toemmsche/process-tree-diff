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

const execSync = require('child_process').execSync;
const assert = require("assert");
const fs = require("fs");
const {Preprocessor} = require("../../src/parse/Preprocessor");
const {XmlFactory} = require("../../src/factory/XmlFactory");
const {MergeTestResult} = require("./MergeTestResult");
const {DeltaMerger} = require("../../src/merge/DeltaMerger");
const {SizeExtractor} = require("../../src/extract/SizeExtractor");
const {TestConfig} = require("../TestConfig");
const {ChawatheMatching} = require("../../src/matching/ChawatheMatch");
const {IdExtractor} = require("../../src/extract/IdExtractor");

class _3dmMergeAdapter {

    mergeAlgorithm;

    constructor() {
        this.mergeAlgorithm = new DeltaMerger();
    }

    evalCase(name, base, branch1, branch2, expected, accepted) {
        const baseString = XmlFactory.serialize(base);
        const branch1String = XmlFactory.serialize(branch1);
        const branch2String = XmlFactory.serialize(branch2);

        const baseFilePath = TestConfig._3DM_PATH + "/base.xml";
        const branch1Filepath = TestConfig._3DM_PATH + "/1.xml";
        const branch2FilePath = TestConfig._3DM_PATH + "/2.xml";

        fs.writeFileSync(baseFilePath, baseString);
        fs.writeFileSync(branch1Filepath, branch1String);
        fs.writeFileSync(branch2FilePath, branch2String);

        let verdict = TestConfig.VERDICTS.OK;
        //TODO prettier
        let mergedXml;
        try {
            mergedXml = execSync(TestConfig._3DM_PATH + "/run.sh " + baseFilePath + " " + branch1Filepath + " " + branch2FilePath).toString();
        } catch (e) {
            //something went wrong...
            verdict = TestConfig.VERDICTS.RUNTIME_ERROR;
        }
        if (verdict === TestConfig.VERDICTS.OK) {
            const actual = new Preprocessor().parseWithMetadata(mergedXml);
            verdict = this._verifyResult(actual, expected, accepted);
        }
        return new MergeTestResult(name, "3DM", verdict);
    }

    _verifyResult(actual, expected, accepted) {
        if (expected.some(t => t.root.deepEquals(actual.root))) {
            return TestConfig.VERDICTS.OK;
        } else if (accepted.some(t => t.root.deepEquals(actual.root))) {
            return TestConfig.VERDICTS.ACCEPTABLE;
        } else {
            return TestConfig.VERDICTS.WRONG_ANSWER;
        }
    }
}

exports._3dmMergeAdapter = _3dmMergeAdapter;
