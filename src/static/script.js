const allLinks = Array.from(
  document.querySelector("#bodyContent").querySelectorAll(".external")
);

function isWmfLink(url) {
  // Accepts a url and checks if url matches any of Wikimedia's domain names
  const wmfLinks = [
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
  const isMatch = wmfLinks.some((pattern) => new RegExp(pattern).test(url));
  return isMatch;
}

const externalLinks = allLinks
  .filter((elt) => !isWmfLink(elt.href))
  .map((elt) => elt.href);

async function postData(url = "", data) {
  // function to post data to the python server
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// send the external links to the python server
if (externalLinks.length > 0) {
  postData(
    "https://deadlinkchecker.toolforge.org/checklinks",
    externalLinks
  ).then((data) => {
    data.forEach((item) => {
      if (item.status_code != 200) {
        //get the item's position
        const position = allLinks.findIndex((elt) => elt.href == item.link);
        const status = document.getElementsByClassName("external")[position];
        status.insertAdjacentHTML(
          "afterend",
          `<span style="color:red">${item.status_code}</span>`
        );
      }
    });
  });
}

