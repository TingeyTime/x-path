// Copyright 2022 Nathan Tingey
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
});

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
    // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState,
    });

    if (nextState === "ON") {
        await chrome.scripting.insertCSS({
            files: ["xpath.css"],
            target: { tabId: tab.id }
        })

        function addCustomCSS(event) {
            event.target.classList.add("xpath_selector")
        }
        
        function removeCustomCSS(event) {
            event.target.classList.remove("xpath_selector")
        }

        function copyXPath(event) {
            var text = document.getElementsByClassName["xpath_selector"]
            navigator.clipboard.writeText(createXPathFromElement(text))
            alert(text+"\nCopied to Clipboard!")
        }

        addEventListener('mouseover', addCustomCSS)

        addEventListener('mouseleave', removeCustomCSS)

        addEventListener('mouseenter', copyXPath)

    } else if (nextState == "OFF") {
        await chrome.scripting.removeCSS({
            files: ["xpath.css"],
            target: { tabId: tab.id }
        })

        removeEventListener('mouseover', addCustomCSS)

        removeEventListener('mouseleave', removeCustomCSS)

        removeEventListener('mouseenter', copyXPath)
    }
})

function createXPathFromElement(element) {
    var allNodes = document.getElementsByTagName('*');
    for (var segs = []; element && element.nodeType == 1; element = element.parentNode) {
        if (element.hasAttribute('id')) {
            var uniqueIdCount = 0;
            for (var n = 0; n < allNodes.length; n++) {
                if (allNodes[n].hasAttribute('id') && allNodes[n].id == element.id) uniqueIdCount++;
                if (uniqueIdCount > 1) break;
            };
            if (uniqueIdCount == 1) {
                segs.unshift('id("' + element.getAttribute('id') + '")');
                return segs.join('/');
            } else {
                segs.unshift(element.localName.toLowerCase() + '[@id="' + element.getAttribute('id') + '"]');
            }
        } else if (element.hasAttribute('class')) {
            segs.unshift(element.localName.toLowerCase() + '[@class="' + element.getAttribute('class') + '"]');
        } else {
            for (i = 1, sib = element.previousSibling; sib; sib = sib.previousSibling) {
                if (sib.localName == element.localName) i++;
            };
            segs.unshift(element.localName.toLowerCase() + '[' + i + ']');
        };
    };
    return segs.length ? '/' + segs.join('/') : null;
};