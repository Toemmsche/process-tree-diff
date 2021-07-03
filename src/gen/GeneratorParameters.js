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

export class GeneratorParameters {

    maxSize;
    maxDepth;
    maxWidth;
    maxVars;
    //TODO remove this property, instead use various amount of changes for testing (e.g. 1, 10, 100, etc)
    numChanges;

    constructor(maxSize, maxDepth, maxWidth, maxVars, numChanges) {
        this.maxSize = maxSize;
        this.maxDepth = maxDepth;
        this.maxWidth = maxWidth;
        this.maxVars = maxVars;
        this.numChanges = numChanges;
    }
}