import {FixedMatcher} from './FixedMatcher.js';
import {PropertyMatcher} from './PropertyMatcher.js';
import {Matching} from './Matching.js';
import {HashMatcher} from './HashMatcher.js';
import {SimilarityMatcher} from './SimilarityMatcher.js';
import {UnmatchedMatcher} from './UnmatchedMatcher.js';
import {Logger} from '../../util/Logger.js';
import {Config} from '../Config.js';
import {CommonalityPathMatcher} from './CommonalityPathMatcher.js';
import {FastSimilarityMatcher} from './FastSimilarityMatcher.js';
import {PathMatcher} from './PathMatcher.js';
import {Comparator} from './Comparator.js';

/**
 * Wrapper for an ordered sequence of matching modules (matchers for short).
 */
export class MatchPipeline {
  /**
   * Enum for the possible match modes.
   * @type {Object}
   */
  static MATCH_MODES = {
    FAST: 'fast',
    BALANCED: 'balanced',
    QUALITY: 'quality',
  };

  /** @type {Array<MatcherInterface>} */
  #matchers;

  /**
   * @param {Array<MatcherInterface>} matchers The list of matchers
   *     constituting this pipeline.
   */
  constructor(matchers) {
    const len = matchers.length;
    // FixedMatcher is always the first matching algorithm in the pipeline
    if (len === 0 || matchers[0].constructor !== FixedMatcher) {
      matchers.unshift(new FixedMatcher());
    }
    // PropertyMatcher is always the last matching algorithm in the pipeline
    if (len === 0 || matchers[len - 1].constructor !== PropertyMatcher) {
      matchers.push(new PropertyMatcher());
    }
    this.#matchers = matchers;
  }

  /**
   * Construct a matching pipeline for use in the matching-based merging
   * algorithm.
   * @return {MatchPipeline}
   */
  static forMerge() {
    return new MatchPipeline(
        [
          new FixedMatcher(),
          new HashMatcher(),
          new SimilarityMatcher(),
          new CommonalityPathMatcher(),
          new PathMatcher(),
          new UnmatchedMatcher(),
          new PropertyMatcher(),
        ]);
  }

  /**
   * Construct a matching pipeline based on the selected matching mode.
   * @return {MatchPipeline}
   */
  static fromMode() {
    switch (Config.MATCH_MODE) {
      case MatchPipeline.MATCH_MODES.FAST:
        return new MatchPipeline(
            [
              new FixedMatcher(),
              new HashMatcher(),
              new FastSimilarityMatcher(),
              new PathMatcher(),
              new PathMatcher(),
              new UnmatchedMatcher(),
              new PropertyMatcher(),
            ]);
      case MatchPipeline.MATCH_MODES.BALANCED:
        Config.EXP = true;
        return new MatchPipeline(
            [
              new FixedMatcher(),
              new HashMatcher(),
              new SimilarityMatcher(),
              new PathMatcher(),
              new PathMatcher(),
              new UnmatchedMatcher(),
              new PropertyMatcher(),
            ]);
      case MatchPipeline.MATCH_MODES.QUALITY:
        Config.EXP = false;
        return new MatchPipeline(
            [
              new FixedMatcher(),
              new HashMatcher(),
              new SimilarityMatcher(),
              new CommonalityPathMatcher(),
              new PathMatcher(),
              new UnmatchedMatcher(),
              new PropertyMatcher(),
            ]);
    }
  }

  /**
   * Construct a matching between the passed process trees by executing the
   * matching pipeline in order.
   * @param {Node} oldTree The root of the old (original) process tree.
   * @param {Node} newTree The root of the new (changed) process tree.
   * @param {Matching} matching An existing matching (used by the merger).
   * @return {Matching}
   */
  execute(oldTree, newTree, matching = new Matching()) {
    const comparator = new Comparator();
    for (const matcher of this.#matchers) {
      Logger.info('Running matching module ' +
          matcher.constructor.name + '...', this);

      Logger.startTimed();
      const prevMatches = matching.size();
      matcher.match(oldTree, newTree, matching, comparator);
      Logger.stat('Matching module ' +
          matcher.constructor.name + ' took ' + Logger.endTimed() +
          'ms and found ' + (matching.size() - prevMatches) +
          ' matches', this);
    }
    return matching;
  }
}
