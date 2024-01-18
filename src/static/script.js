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

  #mountResultsDiv(innerhtml) {
    //Mounts a results dive to the bottom right of the page
    const resultsDiv = document.createElement("div");
    resultsDiv.id = "results-div";
    resultsDiv.innerHTML = `${innerhtml}`;
    resultsDiv.style.position = "absolute";
    resultsDiv.style.position = "fixed";
    resultsDiv.style.bottom = "0px";
    resultsDiv.style.right = "0px";

    document.getElementById("bodyContent").appendChild(resultsDiv);
  }

  #processServerdata(item) {
    const linkElement =
      document.getElementsByClassName("external text")[position];
    linkElement.insertAdjacentHTML(
      "afterend",
      `<span style="color:red">${item.status_code}</span>`
    );
  }

  async findDeadLinks() {
    const externalLinks = this.#getExternalLinks();
    console.log(Object.keys(externalLinks).length);
    if (externalLinks) {
      const data = await this.#sendLinks(
        "https://deadlinkchecker.toolforge.org/checklinks",
        externalLinks
      );
      if (data) {
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
      } else {
        // TODO show okay
      }
    } else {
      // TODO show okay
    }
  }
}

//start to find the links, once the page is loaded
const deadLinkChecker = new DeadLinkChecker();
deadLinkChecker.findDeadLinks();
