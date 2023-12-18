//All links in the document
const allLinks = document
  .getElementById("bodyContent")
  .getElementsByClassName("external");

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

//All non Wikimedia Links
const externalLinks = [];

// Iterate through all links to get only external links
for (let i = 0; i < allLinks.length; i++) {
  link = allLinks[i].href;
  if (!isWmfLink(link)) {
    externalLinks.push(link);
  }
}

// Example POST method implementation:
async function postData(url = "", data) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    //cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    //credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

if (externalLinks.length > 1) {
  postData(
    "https://deadlinkchecker.toolforge.org/checklinks",
    externalLinks
  ).then((data) => {
    let anArray = [];
    for (let index = 0; index < allLinks.length; index++) {
      anArray.push(allLinks[index].href);
    }
    for (let index = 0; index < data.length; index++) {
      let position = anArray.indexOf(data[index].link);

      const status = document.getElementsByClassName("external")[position];
      // $(".external")[position].append(`<p>${data[index].status_code}</p>`);
      status.insertAdjacentHTML(
        "afterend",
        `<span style="color:red">${data[index].status_code}</span>`
      );
    }
  });
}

// TODO post external links to the python server only if the length of the external links array>1
// TODOPost external links to the python server

// Use jQuery to prepend a paragraph with the concatenated string
