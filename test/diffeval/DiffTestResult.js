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

import {TestConfig} from "../TestConfig.js";

export class DiffTestResult {

    info;
    algorithm;
    runtime;

    changes;
    insertions;
    moves;
    updates;
    deletions;

    diffSize;

    constructor(info,algorithm, runtime, changes, insertions, moves, updates, deletions, diffSize) {
        this.info = info;
        this.algorithm = algorithm;
        this.runtime = runtime;
        this.changes = changes;
        this.insertions = insertions;
        this.moves = moves;
        this.updates = updates;
        this.deletions = deletions;
        this.diffSize = diffSize;
    }

    static fail(info, algorithm) {
        return new DiffTestResult(info, algorithm, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED, TestConfig.VERDICTS.FAILED);
    }
    
    static timeout(info, algorithm) {
        return new DiffTestResult(info, algorithm, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT, TestConfig.VERDICTS.TIMEOUT);
    }
}


