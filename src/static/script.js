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
  controller; //controller that will be used to abort the request

  userLanguage; // The user's language on wikipedia
  supportedLanguages = ["pt", "en"];
  languageTexts = {
    en: {
      bad_request: "Bad Request",
      forbidden: "Forbidden",
      not_found: "Not Found",
      unable_to_connect: "Unable to Connect",
      unknown_error: "Unknown Error",
      checkLinks: "Check Links",
      stopLinkChecker: "Stop link checker",
      checkingPage: "checking page...",
      ok: "OK!",
      deadLinksFound: "dead links found",
      checkingDeadlinks: "searching page for dead links",
    },
    pt: {
      bad_request: "Pedido ruim",
      forbidden: "Proibido",
      not_found: "Não encontrado",
      unable_to_connect: "Incapaz de conectar",
      unknown_error: "Erro desconhecido",
      checkLinks: "Verifique links",
      stopLinkChecker: "Parar verificador de link",
      checkingPage: "página de verificação...",
      ok: "OK!",
      deadLinksFound: "links mortos encontrados",
      checkingDeadlinks: "pesquisando página por links mortos",
    },
  };

  constructor() {
    this.userLanguage = this.supportedLanguages.includes(
      mw.config.get("wgUserLanguage")
    )
      ? mw.config.get("wgUserLanguage")
      : "en";
  }
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
    // set up controller and abort signal
    this.controller = new AbortController();
    let signal = this.controller.signal;

    // function to post links to the python server
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal,
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

    resultsDiv.innerHTML = `<span id="deadlinkchecker_cancel" style="cursor:pointer;position:absolute; top:0px; right:5px">&#9746</span><div style="font-family: inherit; ">${message}</div><div style="margin-left:auto; margin-right:auto">${icon}</div>`;

    document
      .getElementById("deadlinkchecker_cancel")
      .addEventListener("click", this.clearResults);
  }

  async findDeadLinks() {
    const externalLinks = this.#getExternalLinks();
    console.log(Object.keys(externalLinks).length);

    this.#mountResultsDiv(); // create a div for displaying results from the the link checker
    if (externalLinks) {
      this.#updateResults(
        this.languageTexts[this.userLanguage]["checkingPage"],
        `<img src='https://upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif' alt='${
          this.languageTexts[this.userLanguage]["checkingDeadlinks"]
        }'>`
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
            getLinkStatusText(this.languageTexts[this.userLanguage][item.status_message])
          );
        });
        // display the count of deadlinks
        this.#updateResults(
          `${data.length} ${this.languageTexts[this.userLanguage]["deadLinksFound"]}`,
          '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/f/f6/OOjs_UI_icon_alert-destructive.svg" width="45" height="45" /></svg>'
        );
      } else {
        // show okay
        this.#updateResults(
          this.languageTexts[this.userLanguage]["ok"],
          '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/1/16/Allowed.svg" width="45" height="45" /></svg>'
        );
      }
    } else {
      // show okay
      this.#updateResults(
        this.languageTexts[this.userLanguage]["ok"],
        '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/1/16/Allowed.svg" width="45" height="45" /></svg>'
      );
    }
  }
}

//start to find the links, once the page is loaded
const startCheckingLinks = () => {
  let deadLinkChecker;
  let controller;

  if (!deadLinkChecker) {
    console.log("deadlinkchecker is falsey");
    // Add a portlet link to start running the script
    mw.util.addPortletLink(
      "p-tb",
      "#",
      "Check links",
      "startDeadLinkChecker",
      "start checking links",
      document.getElementById("t-whatlinkshere")
    );

    // Add an event listener to the portlet to start running the script
    document
      .getElementById("startDeadLinkChecker")
      .addEventListener("click", () => {
        deadLinkChecker = new DeadLinkChecker();
        deadLinkChecker.findDeadLinks();
      });
  } else {
    // Add a portlet link to stop running the script
    controller = deadLinkChecker.controller;
    if (controller) {
      // Add a portlet link to stop running the script
      mw.util.addPortletLink(
        "p-tb",
        "#",
        "Stop link checker",
        "stopDeadLinkChecker",
        "stop checking links",
        document.getElementById("t-whatlinkshere")
      );

      // Add an event listener to the portlet to stop running the script
      document
        .getElementById("stopDeadLinkChecker")
        .addEventListener("click", () => {
          controller.abort();
          deadLinkChecker = "";
        });

      console.log("Controller block executed");
    }

    console.log("deadlinkchecker is truthy");
  }
};
//let deadLinkChecker = new DeadLinkChecker();
//deadLinkChecker.findDeadLinks();
startCheckingLinks();
