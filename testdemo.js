import {TestConfig} from './test/TestConfig.js';
import {Config} from './src/Config.js';
import {GeneratedDiffEvaluation} from './test/eval/GeneratedDiffEvaluation.js';
import {QualityCpeeDiffAdapter} from './test/diff_adapters/QualityCpeeDiffAdapter.js';
import {BalancedCpeeDiffAdapter} from './test/diff_adapters/BalancedCpeeDiffAdapter.js';
import {FastCpeeDiffAdapter} from './test/diff_adapters/FastCpeeDiffAdapter.js';
import {CpeeDiffLocalAdapter} from './test/diff_adapters/CpeeDiffLocalAdapter.js';
import {DiffAlgorithmEvaluation} from './test/eval/DiffAlgorithmEvaluation.js';
import {MatchingAlgorithmEvaluation} from './test/eval/MatchingAlgorithmEvaluation.js';
import {QualityCpeeMatchAdapter} from './test/match_adapters/QualityCpeeMatchAdapter.js';
import {XccAdapter} from './test/diff_adapters/XccAdapter.js';
import {XyDiffAdapter} from './test/diff_adapters/XyDiffAdapter.js';
import {JNDiffAdapter} from './test/diff_adapters/JNDiffAdapter.js';
import {GeneratedMatchEvaluation} from './test/eval/GeneratedMatchEvaluation.js';
import {BalancedCpeeMatchAdapter} from './test/match_adapters/BalancedCpeeMatchAdapter.js';
import {DeltaJsAdapter} from './test/diff_adapters/DeltaJsAdapter.js';
import {XccPatchAdapter} from './test/merge_adapters/XccPatchAdapter.js';
import {_3dmAdapter} from './test/merge_adapters/_3dmAdapter.js';
import {MergeAlgorithmEvaluation} from './test/eval/MergeAlgorithmEvaluation.js';
import {CpeeMergeAdapter} from './test/merge_adapters/CpeeMergeAdapter.js';

/*
const doc = xmldom.DOMImplementation.prototype.createDocument("ASDF", "s");
const root = doc.createElement("tag");
doc.appendChild(root);
root.setAttributeNS("http://example.com/ns", "ns:attr", "val");
console.log(new xmldom.XMLSerializer().serializeToString(doc));
 */

/*

Logger.enableLogging();
Logger.startTimed()
console.log(getFastStringCV("Greetings, this is a Tux".repeat(1000), "I love playing treek on my twenty Linux".repeat(1000)));
Logger.result("took " + Logger.endTimed() + "ms", this);

Logger.startTimed()
console.log(getStringCV("asdfg", "Linux"));
Logger.result("took " + Logger.endTimed() + "ms", this);
 */
/*
Logger.startTimed()
console.log(levenstein("Greetings, this is a Tux".repeat(1000), "I love playing treek on my twenty Linux".repeat(1000)));
Logger.result("took " + Logger.endTimed() + "ms", this);
 */

TestConfig.EXECUTION_OPTIONS.timeout = 30 * 1000;
TestConfig.RUN_AUTOGENERATED_TESTS = true;
Config.LOG_LEVEL = 'all';
//new MatchingAlgorithmEvaluation([new QualityCpeeMatchAdapter()]).evalAll(TestConfig.MATCH_CASES_DIR);
//new GeneratedMatchEvaluation([new QualityCpeeMatchAdapter(), new BalancedCpeeMatchAdapter()]).standardAggregate();
//new DiffAlgorithmEvaluation([new QualityCpeeDiffAdapter(), new JNDiffAdapter()]).evalAll(TestConfig.MATCH_CASES_DIR + "/move/interparent_move");
//new GeneratedDiffEvaluation([new QualityCpeeDiffAdapter(), new BalancedCpeeDiffAdapter()]).standardSingle();
new DiffAlgorithmEvaluation([new QualityCpeeDiffAdapter()]).evalAll();
//new MergeAlgorithmEvaluation([new CpeeMergeAdapter(), new XccPatchAdapter(), new _3dmAdapter()]).evalAll();

/*
const diff = new OurDiffAdapter();


for (let i = 0; i < 10; i++) {
    const gen = new TreeGenerator(new GeneratorParameters(5000, 100, 100, 15, 100));
    const r = gen.randomTree();
    const changed = gen.changeTree(r, 20).tree;
    fs.writeFileSync("A.xml", XmlFactory.serialize(r));
    fs.writeFileSync("B.xml", XmlFactory.serialize(changed));
    diff.evalCase(new DiffTestInfo(), r, changed);
}


const r = new Preprocessor().parseFromFile("A.xml");
const s = new Preprocessor().parseFromFile("B.xml");

const delta = new CpeeDiff().diff(r,s);

console.log(new DeltaTreeGenerator().deltaTree(r, delta).deepEquals(s));

 */