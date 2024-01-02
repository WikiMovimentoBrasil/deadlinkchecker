class DeadLinkChecker {
  // Variables
  #allLinks = Array.from(
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
  #externalLinks = this.#allLinks
    .filter((elt) => !this.#isWmfLink(elt.href))
    .map((elt) => elt.href);

  // Methods
  #isWmfLink(url) {
    // Accepts a url and checks if url matches any of Wikimedia's domain names
    const isMatch = this.#wmfLinks.some((pattern) =>
      new RegExp(pattern).test(url)
    );
    return isMatch;
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

  findDeadLinks() {
    if (this.#externalLinks.length > 0) {
      this.#sendLinks(
        "https://deadlinkchecker.toolforge.org/checklinks",
        this.#externalLinks
      ).then((data) => {
        data.forEach((item) => {
          if (item.status_code != 200) {
            //get the item's position
            const position = this.#allLinks.findIndex(
              (elt) => elt.href == item.link
            );
            const status =
              document.getElementsByClassName("external")[position];
            status.insertAdjacentHTML(
              "afterend",
              `<span style="color:red">${item.status_code}</span>`
            );
          }
        });
      });
    } else {
      //Display on the page that the page is okay
      $("#bodyContent").prepend("<p>Page is OK!</p>");
    }
  }
}

// TODO start to find the links, once the page is loaded
const deadLinkChecker = new DeadLinkChecker();
deadLinkChecker.findDeadLinks();
