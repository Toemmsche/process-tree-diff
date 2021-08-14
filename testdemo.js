
import {DiffAlgorithmEvaluation} from "./test/eval/DiffAlgorithmEvaluation.js";
import {CpeeDiffAdapter} from "./test/diff_adapters/CpeeDiffAdapter.js";
import {XyDiffAdapter} from "./test/diff_adapters/XyDiffAdapter.js";
import {TestConfig} from "./test/TestConfig.js";
import {CpeeDiffLocalAdapter} from "./test/diff_adapters/CpeeDiffLocalAdapter.js";
import {Config} from "./src/Config.js";
import {MatchingAlgorithmEvaluation} from "./test/eval/MatchingAlgorithmEvaluation.js";
import {Logger} from "./util/Logger.js";
import {XccAdapter} from "./test/diff_adapters/XccAdapter.js";
import {DeltaJsAdapter} from "./test/diff_adapters/DeltaJsAdapter.js";
import {DiffXmlAdapter} from "./test/diff_adapters/DiffXmlAdapter.js";
import {XmlDiffAdapter} from "./test/diff_adapters/XmlDiffAdapter.js";
import {GeneratedDiffEvaluation} from "./test/eval/GeneratedDiffEvaluation.js";
import xmldom from "xmldom";
import {GeneratedMatchEvaluation} from "./test/eval/GeneratedMatchEvaluation.js";
import {BalancedCpeeDiffAdapter} from "./test/diff_adapters/BalancedCpeeDiffAdapter.js";
import {FastCpeeDiffAdapter} from "./test/diff_adapters/FastCpeeDiffAdapter.js";
import {QualityCpeeDiffAdapter} from "./test/diff_adapters/QualityCpeeDiffAdapter.js";
import {CpeeMergeAdapter} from "./test/merge_adapters/CpeeMergeAdapter.js";
import {MergeAlgorithmEvaluation} from "./test/eval/MergeAlgorithmEvaluation.js";
import {CpeeMatchAdapter} from "./test/match_adapters/CpeeMatchAdapter.js";

/*
const doc = xmldom.DOMImplementation.prototype.createDocument("ASDF", "s");
const root = doc.createElement("tag");
doc.appendChild(root);
root.setAttributeNS("http://example.com/ns", "ns:attr", "val");
console.log(new xmldom.XMLSerializer().serializeToString(doc));
 */

TestConfig.EXECUTION_OPTIONS.timeout = 30*1000;
TestConfig.RUN_AUTOGENERATED_TESTS = true;
Logger.enableLogging();
Config.LOG_LEVEL = "all";

//new MatchingAlgorithmEvaluation([new CpeeMatchAdapter()]).evalAll();
//new GeneratedMatchEvaluation().standardAggregate();
//new DiffAlgorithmEvaluation([new FastCpeeDiffAdapter(), new BalancedCpeeDiffAdapter(), new QualityCpeeDiffAdapter, new XyDiffAdapter(), new XccAdapter()]).evalAll();
GeneratedDiffEvaluation.all().standardSingle();

//DiffAlgorithmEvaluation.all().evalAll();

//new MergeAlgorithmEvaluation([new CpeeMergeAdapter()]).evalAll();

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