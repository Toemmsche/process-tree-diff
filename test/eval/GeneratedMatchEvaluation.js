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

import {TestConfig} from '../TestConfig.js';

import {Logger} from '../../util/Logger.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {markdownTable} from 'markdown-table';
import {AbstractEvaluation} from './AbstractEvaluation.js';

export class GeneratedMatchEvaluation extends AbstractEvaluation {

  constructor(adapters = []) {
    super(adapters);
  }

  static all() {
    return new GeneratedMatchEvaluation(this.matchAdapters());
  }

  evalAll() {
    Logger.info(
        'Evaluating matching algorithms with generated process trees',
        this
    );

    //Simply run all functions...
    this.standardSingle();
  }

  _getMismatchedNodes(expected, actual) {
    let [mismatchedLeaves, mismatchedInners, unmatchedLeaves, unmatchedInners] = [
      0,
      0,
      0,
      0
    ];

    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) !== oldNode) {
        const actualOldMatch = actual.getMatch(newNode);
        const actualNewMatch = actual.getMatch(oldNode);
        if (newNode.isInnerNode()) {
          //Logger.debug("Mismatched " + newNode.label, this)
          mismatchedInners++;
        } else if (newNode.isLeaf()) {
          //Logger.debug("Mismatched " + newNode.label, this)
          mismatchedLeaves++;
        }
      }
      if (!actual.isMatched(newNode)) {
        if (newNode.isInnerNode()) {
          unmatchedInners++;
        } else if (newNode.isLeaf()) {
          unmatchedLeaves++;
        }
      }
    }

    return [
      mismatchedLeaves,
      mismatchedInners,
      unmatchedLeaves,
      unmatchedInners
    ];
  }

  _matchingCommonality(expected, actual) {
    let common = 0;
    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) === oldNode) {
        common++;
      }
    }

    return 1 - (common / (Math.max(expected.size(), actual.size())));
  }

  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  standardAggregate() {
    Logger.info(
        'Evaluation of matching algorithms with standard size progression',
        this
    );
    const resultsPerAdapter = new Map();
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      const size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);

      //choose sensible generator and change parameters
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size))
      );
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES * (TestConfig.PROGRESSION.FACTOR ** i));

      const testId = [
        size,
        changeParams.totalChanges
      ].join('_');

      const treeGen = new TreeGenerator(genParams);
      let results = new Map();
      for (let j = 0; j < TestConfig.PROGRESSION.REPS; j++) {

        const oldTree = treeGen.randomTree();
        const changedInfo = treeGen.changeTree(oldTree, changeParams);

        const newTree = changedInfo.testCase.newTree;
        const expectedMatching = changedInfo.matching;

        //Run test case for each matching pipeline and compute number of
        // mismatched nodes
        for (const adapter of this.adapters) {
          if (!results.has(adapter)) {
            results.set(adapter, []);
          }
          Logger.info(
              'Running rep ' + j + ' for adapter ' + adapter.displayName,
              this
          );
          const time = new Date().getTime();
          const actualMatching = adapter.run(oldTree, newTree);
          const elapsedTime = new Date().getTime() - time;
          const matchingCommonality = this._matchingCommonality(
              expectedMatching,
              actualMatching
          );
          const mismatches = this._getMismatchedNodes(
              expectedMatching,
              actualMatching
          );
          results.get(adapter).push([
            adapter.displayName,
            testId,
            elapsedTime,
            matchingCommonality,
            ...mismatches
          ]);
        }
      }

      const aggregateResults = [];
      for(const [adapter, resultsList] of results) {
        const aggregateResult = [adapter.displayName, resultsList[0][1]];
        for (let j = 2; j < resultsList[0].length ; j++) {
          aggregateResult.push(this.avg(resultsList.map(r => r[j])));
        }
        aggregateResults.push(aggregateResult);
      }

      for (const result of aggregateResults) {
        if (!resultsPerAdapter.has(result[0])) {
          resultsPerAdapter.set(result[0], []);
        }
        resultsPerAdapter.get(result[0]).push(result);
      }
      Logger.result('Results for case ' + testId, this);
      Logger.result(markdownTable([
        [
          'algorithm',
          'size',
          'runtime',
          'compareSet(M, M_prop)',
          'avg mismatched leaves',
          'avg mismatched inners',
          'avg unmatched leaves',
          'avg unmatched inners',
        ],
        ...aggregateResults
      ]));
    }

    //Produce runtime plots

    const colors = 'black, blue, green, magenta, orange, red, yellow, teal, violet, white'.split(
        ', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace(
          '{1}',
          tests.map(t => '(' + t[1].split('_')[0] + ',' + t[3] + ')').join('')
      ), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ')
        .replaceAll('_', '\\_') + '}');

  }
}

