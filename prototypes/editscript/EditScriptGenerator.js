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


const {UnifiedEditScript, UnifiedChange} = require("./UnifiedEditScript");


class EditScriptGenerator {

    /**
     * Given a (partial) matching between the nodes of two process trees,
     * generates an edit script that includes (subtree) insert, (subree) delete and subtree move operations.
     * Based on the edit script algorithm by
     * Chawathe et al., "UnifiedChange Detection in Hierarchically Structured Information"
     * @param oldModel
     * @param newModel
     * @param matching
     * @param options
     * @return {UnifiedEditScript}
     */
    static generateEditScript(oldModel, newModel, matching, options = []) {
        const editScript = new UnifiedEditScript(oldModel);
        const newToOldMap = matching.newToOldMap;
        const oldToNewMap = matching.oldToNewMap;

        const oldPostOrderArray = oldModel.toPostOrderArray();
        const newPreOrderArray = newModel.toPreOrderArray();

        //iterate in pre order through new model
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two CPEE models
            if (newNode.parent == null) continue;
            const matchOfParent = newToOldMap.get(newNode.parent)[0];
            if (newToOldMap.has(newNode)) {
                //new Node has a match in the old model
                const match = newToOldMap.get(newNode)[0];
                if (matchOfParent !== match.parent) {
                    //move match to matchOfParent
                    editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.MOVE, match, matchOfParent, newNode.childIndex));
                    match.removeFromParent();
                    matchOfParent.insertChild(match, newNode.childIndex);
                }

                if (!newNode.nodeEquals(match)) {
                    //relabel node
                    editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.RELABEL, match, newNode, match.childIndex));
                    match.label = newNode.label;
                }
            } else {
                //perform insert operation at match of the parent node
                const copy = newNode.copy();
                matchOfParent.insertChild(copy, newNode.childIndex);
                //insertions are always mapped back to the original node
                newToOldMap.set(newNode, [copy]);
                oldToNewMap.set(copy, [newNode]);
                editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.INSERTION, copy, matchOfParent, newNode.childIndex));
            }
        }
        const oldDeletedNodes = [];
        for (const oldNode of oldPostOrderArray) {
            if (!oldToNewMap.has(oldNode)) {
                //delete node (old parent
                oldNode.removeFromParent();
                oldDeletedNodes.push(oldNode);
            }
        }
        //second pass to detect the largest subtrees that are fully deleted
        while(oldDeletedNodes.length > 0) {
            let node = oldDeletedNodes[0];
            //parent is also fully deleted
            while(node.parent !== null && oldDeletedNodes.includes(node.parent)) {
                node = node.parent;
            }
            //all nodes from index 0 to node are deleted in a single subtree deletion
            const subTreeSize = oldDeletedNodes.indexOf(node) + 1;
            if(subTreeSize > 1) {
                //subtree deletion
                editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.SUBTREE_DELETION, node, node.parent, node.childIndex));
            } else {
                //leaf node deletion
                editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.DELETION, node, node.parent, node.childIndex));
            }
            oldDeletedNodes.splice(0, subTreeSize);
        }

        //detect subtree insertions
        for (let i = 0; i < editScript.changes.length; i++) {
            const change = editScript.changes[i];
            if (change.type === UnifiedChange.TYPE_ENUM.INSERTION || change.type === UnifiedChange.TYPE_ENUM.COPY) {
                const arr = change.sourceNode.toPreOrderArray();
                //change type must remain the same (insertion or copy)
                for (let j = 1; j < arr.length; j++) {
                    if(i + j >= editScript.changes.length || editScript.changes[i + j].type !== change.type || !editScript.changes[i + j].sourceNode === arr[j]) {
                        break;
                    }
                    if(j === arr.length - 1) {
                        //replace whole subarray with single subtree insertion
                        editScript.changes[i] = new UnifiedChange(UnifiedChange.TYPE_ENUM.SUBTREE_INSERTION, change.sourceNode, change.targetNode, change.modifiedIndex);
                        editScript.changes.splice(i + 1, arr.length - 1);
                    }
                }
            }
        }

        //All nodes have the right path and are matched.
        //However, order of child nodes might not be right, we must verify that it matches the new model.
        for(const oldNode of oldModel.toPreOrderArray()) {
            if(oldNode.hasInternalOrdering() && oldNode.hasChildren()) {
                //Based on A. Marian, "Detecting UnifiedChanges in XML Documents", 2002

                //map each old child node to the child index of its matching partner
                const arr = oldNode.childNodes.map(n => oldToNewMap.get(n)[0].childIndex);

                //find the Longest Increasing Subsequence (LIS) and move every child that is not part of this sequence
                //dp[i] contains the length of the longest sequence that ends at i
                const dp = new Array(arr.length);
                const parent = new Array(arr.length);

                //best value
                let max = 0;
                //Simple O(n²) algorithm to compute the LIS
                for (let i = 0; i < dp.length; i++) {
                    dp[i] = 1;
                    parent[0] = -1;
                    for (let j = 0; j < i; j++) {
                        if(arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
                            dp[i] = dp[j] + 1;
                            parent[i] = j;
                        }
                    }
                    //update best value
                    if(dp[i] > dp[max]) {
                        max = i;
                    }
                }
                //all nodes not part of the LIS have to be reordered
                const reshuffle = oldNode.childNodes.slice();
                while(max !== -1) {
                    reshuffle.splice(max, 1);
                    max = parent[max];
                }

                for(const node of reshuffle) {
                    const match = oldToNewMap.get(node)[0];
                    editScript.changes.push(new UnifiedChange(UnifiedChange.TYPE_ENUM.RESHUFFLE, node, match, match.childIndex));
                    node.changeChildIndex(match.childIndex);
                }
            }
        }

        return editScript;
    }
}

exports.EditScriptGenerator = EditScriptGenerator;