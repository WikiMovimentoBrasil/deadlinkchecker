class DeadLinkChecker {
  // Variables
  #externalLinksElements = Array.from(
    document.querySelector("#bodyContent").querySelectorAll(".external")
  );

  #wmfLinks = [
    "^https?:\\/\\/[\\w-]+\\.wikipedia\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikimedia\\.(org|ch|at|de)",
    "^https?:\\/\\/toolserver\\.org",
    "^https?:\\/\\/creativecommons\\.org",
    "^https?:\\/\\/www\\.gnu\\.org",
    "^https?:\\/\\/wikimediafoundation\\.org",
    "^https?:\\/\\/wikimedia\\.de",
    "^https?:\\/\\/([\\w-.]+)?wikiquote\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikisource\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikiversity\\.org",
    "^https?:\\/\\/([\\w-.]+)?wiktionary\\.org",
    "^https?:\\/\\/([\\w-.]+)?mediawiki\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikinews\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikibooks\\.org",
    "^https?:\\/\\/tools\\.wmflabs\\.org",
    "^https?:\\/\\/([\\w-.]+)?toolforge\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikitravel\\.org",
    "^https?:\\/\\/([\\w-.]+)?wikidata\\.org",
    "^https?:\\/\\/secure.wikimedia\\.org",
    "^https://web.archive.org/web/",
  ];

  // Methods

  #getExternalLinks() {
    let externalLinks = {};
    let externalLinksElementsSize = this.#externalLinksElements.length;

    for (let index = 0; index < externalLinksElementsSize; index++) {
      let url = this.#externalLinksElements[index].href;
      const iswmfLink = this.#wmfLinks.some((pattern) =>
        new RegExp(pattern).test(url)
      );
      if (!iswmfLink) {
        externalLinks[index] = url;
      }
    }
    return externalLinks;
  }

  async #sendLinks(url = "", data) {
    // function to post links to the python server
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  #mountResultsDiv() {
    //Mounts a results dive to the bottom right of the page
    const resultsDiv = document.createElement("div");
    resultsDiv.id = "results-div";
    resultsDiv.style.position = "fixed";
    resultsDiv.style.bottom = "0px";
    resultsDiv.style.right = "5px";
    resultsDiv.style.padding = "5px";
    resultsDiv.style.width = "150px";
    resultsDiv.style.textAlign = "center";
    resultsDiv.style.backgroundColor = "#e7e7e7";
    resultsDiv.style.borderRadius = "5px";
    resultsDiv.style.border = "1px solid #80807f";

    document.getElementById("bodyContent").appendChild(resultsDiv);
  }

  clearResults() {
    const resultsDiv = document.getElementById("results-div");
    if (resultsDiv) {
      resultsDiv.remove();
    }
  }


  #updateResults(message, icon) {
    // get the results div
    const resultsDiv = document.getElementById("results-div");
    if (!resultsDiv) {
      this.#mountResultsDiv();
    }

    resultsDiv.innerHTML = `<span style="cursor:pointer;position:absolute; top:0px; right:5px" onclick="this.clearResults()">&#9746</span><div style="font-family: inherit; ">${message}</div><div style="margin-left:auto; margin-right:auto">${icon}</div>`;
  }

  async findDeadLinks() {
    const externalLinks = this.#getExternalLinks();
    console.log(Object.keys(externalLinks).length);

    this.#mountResultsDiv(); // create a div for displaying results from the the link checker
    if (externalLinks) {
      this.#updateResults(
        "checking page...",
        "<img src='https://upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif' alt='checking for deadlinks'/>"
      );
      const data = await this.#sendLinks(
        "https://deadlinkchecker.toolforge.org/checklinks",
        externalLinks
      );
      if (data && data.length > 0) {
        data.forEach((item) => {
          let position = item.link[0];
          const LinkStatus =
            document.getElementsByClassName("external")[position];

          function getLinkStatusText(errorMessage) {
            const linkText = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                          <image href="https://upload.wikimedia.org/wikipedia/commons/f/f6/OOjs_UI_icon_alert-destructive.svg" width="16" height="16" />
                       </svg><span style="color: red;">[${errorMessage}]</span>`;
            return linkText;
          }
          LinkStatus.insertAdjacentHTML(
            "afterend",
            getLinkStatusText(item.status_message)
          );
        });
        // display the count of deadlinks
        this.#updateResults(
          `${data.length} dead links found`,
          '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/f/f6/OOjs_UI_icon_alert-destructive.svg" width="45" height="45" /></svg>'
        );
      } else {
        // show okay
        this.#updateResults(
          "OK!",
          '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/1/16/Allowed.svg" width="45" height="45" /></svg>'
        );
      }
    } else {
      // show okay
      this.#updateResults(
        "OK!",
        '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/1/16/Allowed.svg" width="45" height="45" /></svg>'
      );
    }
  }
}

//start to find the links, once the page is loaded
const deadLinkChecker = new DeadLinkChecker();
deadLinkChecker.findDeadLinks();
