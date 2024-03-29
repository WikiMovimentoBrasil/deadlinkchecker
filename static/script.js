let controller;
let checking = "IDLE";

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
    "^https?:\\/\\/web.archive.org\\/web",
    "^https?:\\/\\/musicbrainz\\.org",
  ];

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
      deadLinksFound: "dead link(s) found",
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
      deadLinksFound: "link(s) mortos encontrados",
      checkingDeadlinks: "pesquisando página por links mortos",
    },
  };
  sessionId; // sessionId of the user
  wiki; // the wiki the user is accessing the tool from

  constructor() {
    this.userLanguage = this.supportedLanguages.includes(
      mw.config.get("wgUserLanguage")
    )
      ? mw.config.get("wgUserLanguage")
      : "en";
    this.sessionId = mw.storage.get("deadlinkchecker") || null;
    this.wiki = mw.config.get("wgServerName");
    this.username = mw.config.get("wgUserName");
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
    controller = new AbortController();
    let signal = controller.signal;

    try {
      // function to post links to the python server
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal,
      });

      // Check for 500 error status
      if (response.status === 500) {
        return false;
      }
      return response.json();

    } catch (error) {
      // Handle other errors, such as network errors or parsing errors
      console.error("Error during fetch:", error);
      return false; // Alternatively, re-throw the error if needed
    }
  }

  #mountResultsDiv() {
    //Mounts a results div to the bottom right of the page
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

    resultsDiv.innerHTML = `<span id="deadlinkchecker_cancel" style="cursor:pointer;position:absolute; top:0px; right:5px">&#9746</span><div id="deadlinkfindermsg" style="font-family: inherit; ">${message}</div><div style="margin-left:auto; margin-right:auto">${icon}</div>`;

    document
      .getElementById("deadlinkchecker_cancel")
      .addEventListener("click", this.clearResults);
  }

  #batchLinks(links, req_batch_size = 20) {
    const batch_size = req_batch_size;
    const batches = [];
    const keys = Object.keys(links);

    if (keys.length > batch_size) {
      for (let i = 0; i < keys.length; i += batch_size) {
        const batch = {};
        for (let j = i; j < i + batch_size && j < keys.length; j++) {
          batch[keys[j]] = links[keys[j]];
        }
        batches.push(batch);
      }
    } else {
      batches.push(links);
    }
    return batches;
  }

  async authenticateUser(wiki) {
    // authorize the tool to identify the user
    //console.log("login button clicked")

    try {
      const loginUrl = `https://deadlinkchecker.toolforge.org/login/${wiki}`;
      window.open(loginUrl, "popup");
    } catch (error) {
      console.log("unable to login");
    }
  }

  async findDeadLinks() {
    console.log(`the wiki name is ${this.wiki}`)
    console.log(`the sessionId is ${this.sessionId}`)
    if(this.sessionId===null){
      //prompt the user to login
      const loginPrompt=document.createElement("div");
            loginPrompt.style.position = "fixed";
            loginPrompt.style.bottom = "0px";
            loginPrompt.style.right = "5px";
            loginPrompt.style.padding = "5px";
            loginPrompt.style.width = "150px";
            loginPrompt.style.textAlign = "center";
            loginPrompt.style.backgroundColor = "#e7e7e7";
            loginPrompt.style.borderRadius = "5px";
            loginPrompt.style.border = "1px solid #80807f";
            loginPrompt.innerHTML=`<p>Deadlink checker would like to identify you before using it</p><button id="deadlinkchecker-login">Authorize</button>`
      document.getElementById("bodyContent").appendChild(loginPrompt);
      document
        .getElementById("deadlinkchecker-login")
        .addEventListener("click", this.authenticateUser(this.wiki));
      return;
    }

    const externalLinks = this.#getExternalLinks();
    console.log(Object.keys(externalLinks).length);
    const batches = this.#batchLinks(externalLinks);

    this.#mountResultsDiv(); // create a div for displaying results from the the link checker
    if (Object.keys(batches[0]).length > 0) {
      this.#updateResults(
        this.languageTexts[this.userLanguage]["checkingPage"],
        `<img src='https://upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif' alt='${
          this.languageTexts[this.userLanguage]["checkingDeadlinks"]
        }'>`
      );

      let deadLinkCount = 0;
      for (let i = 0; i < batches.length; i++) {
        const data = await this.#sendLinks(
          "https://deadlinkchecker.toolforge.org/checklinks",
          {
            urls: batches[i],
            wiki: this.wiki,
            sessionId: this.sessionId,
            username: this.username,
          }
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
              getLinkStatusText(
                this.languageTexts[this.userLanguage][item.status_message]
              )
            );
          });
          // update the message with the number of dead links
          deadLinkCount += data.length;
          let messageElement = document.getElementById("deadlinkfindermsg");
          messageElement.textContent = deadLinkCount;
        } else {
          //TODO: Deal with 500 responses
        }
      }

      if (deadLinkCount > 0) {
        // display the count of deadlinks
        this.#updateResults(
          `${deadLinkCount} ${
            this.languageTexts[this.userLanguage]["deadLinksFound"]
          }`,
          '<svg width="45" height="45" xmlns="http://www.w3.org/2000/svg"><image href="https://upload.wikimedia.org/wikipedia/commons/f/f6/OOjs_UI_icon_alert-destructive.svg" width="45" height="45" /></svg>'
        );
      } else {
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

class DeadlinkCheckerSingleton {
  static instance = null;

  constructor() {}

  static startChecking() {
    if (!DeadlinkCheckerSingleton.instance) {
      DeadlinkCheckerSingleton.instance = new DeadLinkChecker();
      DeadlinkCheckerSingleton.instance.findDeadLinks();
    }
    checking = "CHECKING";
    return DeadlinkCheckerSingleton.instance;
  }

  static stopChecking() {
    controller.abort();
    DeadlinkCheckerSingleton.instance = null;
    checking = "IDLE";
  }
}

function createCheckLink() {
  return new Promise(function (resolve, reject) {
    // function ...
    resolve(
      mw.util.addPortletLink(
        "p-tb",
        "#",
        "Check links",
        "startDeadLinkChecker",
        "start checking links",
        document.getElementById("t-whatlinkshere")
      )
    );
  });
}

function stopCheckLink() {
  return new Promise(function (resolve, reject) {
    resolve(
      mw.util.addPortletLink(
        "p-tb",
        "#",
        "Stop link checker",
        "stopDeadLinkChecker",
        "stop checking links",
        document.getElementById("t-whatlinkshere")
      )
    );
  });
}

(function () {
  if (checking === "CHECKING") {
    stopCheckLink().then(() =>
      document
        .getElementById("stopDeadLinkChecker")
        .addEventListener("click", DeadlinkCheckerSingleton.stopChecking)
    );
  } else {
    createCheckLink().then(() =>
      document
        .getElementById("startDeadLinkChecker")
        .addEventListener("click", DeadlinkCheckerSingleton.startChecking)
    );
  }
})();

// To run in the sessionid callback
if (mw.config.get("wgNamespaceNumber") == -1) {
  //split page title
  var pagetitle = mw.config.get("wgTitle").split("/");

  if (pagetitle[0] == "Deadlinkchecker" && pagetitle[1]) {
    mw.storage.set("deadlinkchecker", pagetitle[1]);
    window.opener.location.reload();
    window.close();
  }
}
